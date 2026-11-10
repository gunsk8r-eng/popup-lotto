// ดึงรายชื่อเกม + RTP ที่ Pragmatic Play ประกาศไว้ในหน้าแต่ละเกมบน pragmaticplay.com → rtpslot/pp.json
// (เจ้าของเว็บยืนยันอายุ 18+ และอนุญาตให้ดึงข้อมูลนี้แล้ว) ใช้: node rtpslot/pp-crawl.js
const fs = require('fs');
const BASE = 'https://www.pragmaticplay.com/en/games/';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; popup-rtpslot)' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dec = s => s.replace(/&#x([0-9a-f]+);?/gi, (_, h) => h.toLowerCase() === '2122' ? '' : String.fromCodePoint(parseInt(h, 16))).replace(/&#0*38;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').trim();

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, UA); if (r.ok) return await r.text(); } catch (e) {}
    await sleep(2000 * (i + 1));
  }
  throw new Error('โหลดไม่ได้: ' + url);
}

(async () => {
  // 1) รายชื่อเกมทั้งหมด (หน้าแรก + หน้าที่ระบบ "Load More" โหลดเพิ่ม)
  const games = new Map();
  const add = html => {
    let n = 0;
    for (const m of html.matchAll(/class="game__thumbnail" title="([^"]+)"\s+href="https:\/\/www\.pragmaticplay\.com\/en\/games\/([^/"?]+)\/[^"]*">[\s\S]*?data-src="https:\/\/www\.pragmaticplay\.com\/wp-content\/uploads\/([^"]+)"/g)) {
      if (!games.has(m[2])) { games.set(m[2], { slug: m[2], n: dec(m[1]), img: m[3] }); n++; }
    }
    return n;
  };
  add(await get(BASE));
  for (let page = 2; page < 200; page++) {
    const n = add(await get(BASE + '?ajax=1&cats=undefined&lang=en&cur=USD&studio=all&device=undefined&search=&page=' + page));
    if (!n) break;
    await sleep(300);
  }
  console.log('พบเกม', games.size);
  if (process.argv[2] === '--images') {
    const f = __dirname + '/pp.json', j = JSON.parse(fs.readFileSync(f, 'utf8')), by = {};
    games.forEach(g => { by[g.n] = g.img; });
    j.games.forEach(g => { if (by[g[0]]) g[2] = by[g[0]]; });
    fs.writeFileSync(f, JSON.stringify(j));
    return console.log('ใส่รูป', j.games.filter(g => g[2]).length, '/', j.games.length);
  }

  // 2) RTP จากหน้าแต่ละเกม ("Basic Game Info · RTP: 96.50%") — เรียงตามลำดับในเว็บ (ใหม่ → เก่า)
  const out = [];
  let i = 0;
  for (const g of games.values()) {
    i++;
    try {
      const h = await get(BASE + g.slug + '/');
      const m = /RTP:\s*<span>\s*([\d.]+)\s*%/.exec(h);
      if (m) out.push([g.n, +m[1], g.img]); // img = path ใต้ wp-content/uploads/
    } catch (e) { console.warn(e.message); }
    if (i % 50 === 0) console.log(i, '/', games.size, '· มี RTP', out.length);
    await sleep(250);
  }
  fs.writeFileSync(__dirname + '/pp.json', JSON.stringify({ date: new Date().toISOString().slice(0, 10), games: out }));
  console.log('บันทึก', out.length, 'เกมที่มี RTP → rtpslot/pp.json');
})().catch(e => { console.error(e); process.exit(1); });
