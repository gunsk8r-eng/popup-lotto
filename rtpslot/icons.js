// ดาวน์โหลดรูปเกม → ย่อเป็นไอคอน 36×36 รวมเป็นรูปเดียว (sprite webp) → rtpslot/<ค่าย>-icons.json { cell, cols, names, sprite }
//   node rtpslot/icons.js       Pragmatic Play (เฉพาะเกมใน pp-popular.txt)
//   node rtpslot/icons.js ns    Nextspin (ทุกเกมใน ns.json)
// ต้องมี python3 + Pillow สำหรับย่อรูป
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const PROV = process.argv[2] === 'ns' ? 'ns' : 'pp';
const UP = PROV === 'ns' ? 'https://www.nextspin.com/' : 'https://www.pragmaticplay.com/wp-content/uploads/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => s.toLowerCase().replace(/[®™]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

(async () => {
  const src = JSON.parse(fs.readFileSync(__dirname + '/' + PROV + '.json', 'utf8'));
  const IMG = PROV === 'ns' ? 3 : 2; // ตำแหน่งของ path รูปในแต่ละแถว
  const byName = new Map(src.games.map(g => [norm(g[0]), g]));
  const popular = PROV === 'ns' ? src.games.map(g => g[0])
    : fs.readFileSync(__dirname + '/pp-popular.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => s && s[0] !== '#');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ppicons-'));
  const list = [];
  for (const n of popular) {
    const g = byName.get(norm(n));
    if (!g || !g[IMG]) { console.warn('ไม่มีรูป:', n); continue; }
    const file = path.join(tmp, list.length + '.img');
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(UP + g[IMG].split('/').map(encodeURIComponent).join('/'), { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; popup-rtpslot)' } });
        const buf = Buffer.from(await r.arrayBuffer());
        if (r.ok && buf.length > 1000) { fs.writeFileSync(file, buf); list.push([n, file]); break; }
      } catch (e) {}
      await sleep(1500 * (i + 1));
    }
    await sleep(300);
  }
  // รวมเป็นรูปเดียวแบบตาราง (sprite) 10 คอลัมน์ ช่องละ 36×36 → webp เดียว บีบได้เล็กกว่ารูปแยกหลายเท่า
  const py = `
import sys, json, base64, io
from PIL import Image
items = json.load(open(sys.argv[1])); C = 36; cols = 10; rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * C, rows * C), (233, 227, 255))
names = []
for k, (name, f) in enumerate(items):
    src = Image.open(f).convert('RGBA'); im = Image.new('RGB', src.size, (255, 255, 255)); im.paste(src, mask=src)  # พื้นโปร่งใส → ขาว
    w, h = im.size; s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((C, C), Image.LANCZOS)
    sheet.paste(im, ((k % cols) * C, (k // cols) * C)); names.append(name)
b = io.BytesIO(); sheet.save(b, 'WEBP', quality=int(sys.argv[3]), method=6)
json.dump({'cell': C, 'cols': cols, 'names': names, 'sprite': 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()}, open(sys.argv[2], 'w'))
`;
  fs.writeFileSync(path.join(tmp, 'list.json'), JSON.stringify(list));
  execFileSync('python3', ['-I', '-c', py, path.join(tmp, 'list.json'), __dirname + '/' + PROV + '-icons.json', process.env.Q || '20'], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('ไอคอน', list.length, '/', popular.length, '→ rtpslot/' + PROV + '-icons.json', fs.statSync(__dirname + '/' + PROV + '-icons.json').size, 'ไบต์');
})().catch(e => { console.error(e); process.exit(1); });
