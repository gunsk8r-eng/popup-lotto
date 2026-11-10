// สร้าง popup-rtpslot.js: ดึงรายชื่อเกม + RTP ของ PG Soft จาก api.pgsoft.com แล้วฝังลงในไฟล์ แล้วย่อขนาด
// ใช้: node rtpslot/build.js   (ต้องมี terser: npx terser)
const fs = require('fs'), { execFileSync } = require('child_process');
const API = 'https://api.pgsoft.com/Game/GetDefaultAllGame/language/en-US';

(async () => {
  const j = await (await fetch(API, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
  const slots = j.dt.dagl.filter(g => g.gtl.includes(11) && /^\d+(\.\d+)?%$/.test(g.maxrtp)); // 11 = Video Slot
  if (slots.length < 50) throw new Error('ได้เกมน้อยผิดปกติ: ' + slots.length);
  const clean = s => s.replace(/[|;]/g, ' ').replace(/[’]/g, "'").trim();
  const data = slots.map(g => {
    const ic = ((g.grl.ourl || []).find(o => o.pi === 4) || {}).v || '';
    const m = /^\/uploads\/Games\/Images\/([0-9a-f-]{36}\.(?:png|webp))$/.exec(ic);
    return [clean(g.gn), parseFloat(g.maxrtp), g.hrm || '', m ? m[1] : ''].join('|');
  }).join(';');
  // Pragmatic Play: จาก rtpslot/pp.json (สร้างด้วย node rtpslot/pp-crawl.js)
  let pp = { date: '', games: [] };
  try { pp = JSON.parse(fs.readFileSync(__dirname + '/pp.json', 'utf8')); } catch (e) { console.warn('ไม่มี pp.json — ข้าม Pragmatic Play'); }
  const ppData = pp.games.map(g => [clean(g[0]), g[1]].join('|')).join(';');
  const thd = iso => iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' });
  const src = fs.readFileSync(__dirname + '/rtpslot.src.js', 'utf8')
    .replace("'@@PG_DATA@@'", JSON.stringify(data)).replace("'@@PG_DATE@@'", JSON.stringify(today))
    .replace("'@@PP_DATA@@'", JSON.stringify(ppData)).replace("'@@PP_DATE@@'", JSON.stringify(thd(pp.date)));
  const full = __dirname + '/popup-rtpslot.full.js';
  fs.writeFileSync(full, src);
  const min = execFileSync('npx', ['--yes', 'terser', full, '-c', '-m', '--comments', 'false'], { encoding: 'utf8' });
  const head = '/* ป๊อปอัป RTP สล็อต (ค่าที่ค่ายประกาศ) — PG Soft ณ ' + today + (pp.games.length ? ' · Pragmatic Play ณ ' + thd(pp.date) : '') + "\n" +
    "   ตั้งค่า (ไม่บังคับ) วางก่อนโค้ดนี้: window.RTP_OPT = { side: 'right', top: 50 };\n" +
    "   เพิ่มเกมค่ายอื่น: window.RTP_EXTRA = { xo: [['ชื่อเกม', 96.5, '5000x']], ns: [], rs: [] }; */\n";
  const out = __dirname + '/popup-rtpslot.js';
  fs.writeFileSync(out, head + min);
  console.log('PG', slots.length, '· PP', pp.games.length, 'เกม ·', Buffer.byteLength(head + min), 'ไบต์ →', out);
})().catch(e => { console.error(e); process.exit(1); });
