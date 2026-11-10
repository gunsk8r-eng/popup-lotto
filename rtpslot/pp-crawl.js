// ดึงรายชื่อเกม + RTP ที่ Pragmatic Play ประกาศไว้ในหน้าแต่ละเกมบน pragmaticplay.com → rtpslot/pp.json
// (เจ้าของเว็บยืนยันอายุ 18+ และอนุญาตให้ดึงข้อมูลนี้แล้ว) ใช้: node rtpslot/pp-crawl.js
const fs = require('fs');
const BASE = 'https://www.pragmaticplay.com/en/games/';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; popup-rtpslot)' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dec = s => s.replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').trim();

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
    for (const m of html.matchAll(/class="game__thumbnail" title="([^"]+)"\s+href="https:\/\/www\.pragmaticplay\.com\/en\/games\/([^/"?]+)\//g)) {
      if (!games.has(m[2])) { games.set(m[2], { slug: m[2], n: dec(m[1]) }); n++; }
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

  // 2) RTP จากหน้าแต่ละเกม ("Basic Game Info · RTP: 96.50%") — เรียงตามลำดับในเว็บ (ใหม่ → เก่า)
  const out = [];
  let i = 0;
  for (const g of games.values()) {
    i++;
    try {
      const h = await get(BASE + g.slug + '/');
      const m = /RTP:\s*<span>\s*([\d.]+)\s*%/.exec(h);
      if (m) out.push([g.n, +m[1]]);
    } catch (e) { console.warn(e.message); }
    if (i % 50 === 0) console.log(i, '/', games.size, '· มี RTP', out.length);
    await sleep(250);
  }
  fs.writeFileSync(__dirname + '/pp.json', JSON.stringify({ date: new Date().toISOString().slice(0, 10), games: out }));
  console.log('บันทึก', out.length, 'เกมที่มี RTP → rtpslot/pp.json');
})().catch(e => { console.error(e); process.exit(1); });
