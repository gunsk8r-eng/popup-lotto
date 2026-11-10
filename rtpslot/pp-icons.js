// ดาวน์โหลดรูปของเกม Pragmatic Play ที่อยู่ใน pp-popular.txt → ย่อเป็นไอคอนสี่เหลี่ยม 48×48 (webp)
// → rtpslot/pp-icons.json { ชื่อเกม: "data:image/webp;base64,..." } ให้ build.js ฝังลงในไฟล์ JS
// ใช้: node rtpslot/pp-icons.js   (ต้องมี python3 + Pillow สำหรับย่อรูป)
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const UP = 'https://www.pragmaticplay.com/wp-content/uploads/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => s.toLowerCase().replace(/[®™]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

(async () => {
  const pp = JSON.parse(fs.readFileSync(__dirname + '/pp.json', 'utf8'));
  const byName = new Map(pp.games.map(g => [norm(g[0]), g]));
  const popular = fs.readFileSync(__dirname + '/pp-popular.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => s && s[0] !== '#');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ppicons-'));
  const list = [];
  for (const n of popular) {
    const g = byName.get(norm(n));
    if (!g || !g[2]) { console.warn('ไม่มีรูป:', n); continue; }
    const file = path.join(tmp, list.length + '.img');
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(UP + g[2].split('/').map(encodeURIComponent).join('/'), { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; popup-rtpslot)' } });
        const buf = Buffer.from(await r.arrayBuffer());
        if (r.ok && buf.length > 1000) { fs.writeFileSync(file, buf); list.push([n, file]); break; }
      } catch (e) {}
      await sleep(1500 * (i + 1));
    }
    await sleep(300);
  }
  // ย่อรูป: ตัดตรงกลางเป็นสี่เหลี่ยมจัตุรัส → 48×48 webp (เล็กพอให้ระบบหลังบ้านของเว็บบันทึกทัน)
  const py = `
import sys, json, base64, io
from PIL import Image
out = {}
for name, f in json.load(open(sys.argv[1])):
    src = Image.open(f).convert('RGBA'); im = Image.new('RGB', src.size, (255, 255, 255)); im.paste(src, mask=src)  # พื้นโปร่งใส → ขาว
    w, h = im.size; s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((48, 48), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=50, method=6)
    out[name] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
json.dump(out, open(sys.argv[2], 'w'))
`;
  fs.writeFileSync(path.join(tmp, 'list.json'), JSON.stringify(list));
  execFileSync('python3', ['-I', '-c', py, path.join(tmp, 'list.json'), __dirname + '/pp-icons.json'], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('ไอคอน', list.length, '/', popular.length, '→ rtpslot/pp-icons.json', fs.statSync(__dirname + '/pp-icons.json').size, 'ไบต์');
})().catch(e => { console.error(e); process.exit(1); });
