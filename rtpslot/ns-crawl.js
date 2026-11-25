// ดึงรายชื่อเกมสล็อต + RTP ที่ Nextspin ประกาศไว้ในหน้ารายละเอียดเกมบน nextspin.com → rtpslot/ns.json
// รูปเกม: nextspin.com/static/images/gamepic/<รหัสเกม>_350x350.jpg   ใช้: node rtpslot/ns-crawl.js
const fs = require('fs');
const BASE = 'https://www.nextspin.com/';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; popup-rtpslot)' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dec = s => s.replace(/&#0*39;|&#x27;|&rsquo;|&#8217;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, UA); if (r.ok) return await r.text(); } catch (e) {}
    await sleep(2000 * (i + 1));
  }
  throw new Error('โหลดไม่ได้: ' + url);
}

(async () => {
  const html = await get(BASE + 'game?language=en_US');
  const games = [], seen = new Set();
  // <div class="game-product"><img src="static/images/gamepic/<code>_350x350.jpg" alt="ชื่อ"> ... <p class="text-primary">SLOT</p> ... gameCode=<code>
  for (const m of html.matchAll(/class="game-product">\s*<img src="(static\/images\/gamepic\/[^"]+)" alt="([^"]+)"[\s\S]*?<p class="text-primary">\s*([A-Z]+)\s*<\/p>[\s\S]*?gameCode=([\w-]+)/g)) {
    if (m[3] !== 'SLOT' || seen.has(m[4])) continue;
    seen.add(m[4]);
    games.push({ code: m[4], n: dec(m[2]), img: m[1] });
  }
  console.log('พบสล็อต', games.length);
  const out = [];
  for (const g of games) {
    try {
      const t = (await get(BASE + 'game-details?gameCode=' + g.code + '&language=en_US')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const m = /RTP\s+([\d.]+)\s*%?/.exec(t); // บางเกมไม่มีเครื่องหมาย %
      if (m && +m[1] < 100) out.push([g.n, +m[1], '', g.img]);
      else console.warn('ไม่พบ RTP:', g.n);
    } catch (e) { console.warn(e.message); }
    await sleep(300);
  }
  fs.writeFileSync(__dirname + '/ns.json', JSON.stringify({ date: new Date().toISOString().slice(0, 10), games: out }));
  console.log('บันทึก', out.length, 'เกม → rtpslot/ns.json');
})().catch(e => { console.error(e); process.exit(1); });
