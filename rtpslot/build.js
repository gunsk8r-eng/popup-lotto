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
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' });
  const src = fs.readFileSync(__dirname + '/rtpslot.src.js', 'utf8')
    .replace("'@@PG_DATA@@'", JSON.stringify(data)).replace("'@@PG_DATE@@'", JSON.stringify(today));
  const full = __dirname + '/popup-rtpslot.full.js';
  fs.writeFileSync(full, src);
  const min = execFileSync('npx', ['--yes', 'terser', full, '-c', '-m', '--comments', 'false'], { encoding: 'utf8' });
  const head = '/* ป๊อปอัป RTP สล็อต (ค่าที่ค่ายประกาศ) — ข้อมูล PG Soft ณ ' + today + "\n" +
    "   ตั้งค่า (ไม่บังคับ) วางก่อนโค้ดนี้: window.RTP_OPT = { side: 'right', top: 50 };\n" +
    "   เพิ่มเกมค่ายอื่น: window.RTP_EXTRA = { pp: [['ชื่อเกม', 96.5, '5000x']], xo: [], ns: [], rs: [] }; */\n";
  const out = __dirname + '/popup-rtpslot.js';
  fs.writeFileSync(out, head + min);
  console.log(slots.length, 'เกม ·', Buffer.byteLength(head + min), 'ไบต์ →', out);
})().catch(e => { console.error(e); process.exit(1); });
