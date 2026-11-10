// ดึงผลหวยหลายประเภทแล้วเขียนเป็น lotto.json ให้ป๊อปอัปหวยอ่าน
// GitHub Actions รันไฟล์นี้อัตโนมัติ (ดู .github/workflows/lotto.yml) — รันเองได้ด้วย: node update-lotto.js
//
//   draws  สลากกินแบ่งรัฐบาล   ← API กองสลาก (glo.or.th)
//   lao    หวยลาวพัฒนา        ← check-lottery.com
//   hanoi  หวยฮานอย 4 รอบ     ← check-lottery.com
//   stock  หวยหุ้น (ดัชนีปิด)  ← Yahoo Finance
//   gsb    สลากออมสิน         ← imhuay.com
//   baac   สลาก ธ.ก.ส.        ← imhuay.com
//   malay  หวยมาเลย์ (Magnum 4D) ← check4d.org
//
// แต่ละประเภทดึงแยกกัน ถ้าแหล่งไหนพัง จะเก็บผลเดิมของประเภทนั้นไว้ ประเภทอื่นยังอัปเดตได้ตามปกติ
const fs = require('fs');
const FILE = __dirname + '/lotto.json';
const KEEP = 12;        // หวยรัฐบาล: เก็บย้อนหลังกี่งวด
const KEEP_DAILY = 20;  // หวยที่ออกบ่อย (ลาว ฮานอย หุ้น มาเลย์): เก็บย้อนหลังกี่งวด
const UA = 'Mozilla/5.0 (compatible; popup-lotto-bot; +https://github.com/gunsk8r-eng/popup-lotto)';

// ===== เครื่องมือ =====
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'th,en;q=0.8' } });
  if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
  return r.text();
}
// HTML → ข้อความล้วน บรรทัดเดียว (แยกตัวเลขด้วยเว้นวรรค) เพื่อให้จับด้วย regex ได้ ไม่ผูกกับชื่อ class ของเว็บ
function text(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s+/g, ' ');
}
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DATE = '(\\d{1,2}) (' + TH_MON.map(m => m.replace(/\./g, '\\.')).join('|') + ') (25\\d\\d)';
const p2 = n => String(n).padStart(2, '0');
// "8 พ.ย. 2569" → "2026-11-08"
const isoTh = (d, m, y) => (y - 543) + '-' + p2(TH_MON.indexOf(m) + 1) + '-' + p2(d);
// รวมผลใหม่กับผลเดิม: วันเดียวกันใช้ของใหม่, วันที่แหล่งข้อมูลไม่มีแล้วเก็บของเดิมไว้
function merge(fresh, old, keep) {
  const by = {};
  (old || []).forEach(r => { by[r.date] = r; });
  fresh.forEach(r => { by[r.date] = r; });
  return Object.values(by).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, keep);
}

// ===== สลากกินแบ่งรัฐบาล (กองสลาก) =====
const GLO = 'https://www.glo.or.th/api/';
async function post(path, body) {
  const r = await fetch(GLO + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(path + ' HTTP ' + r.status);
  const j = await r.json();
  if (!j.status) throw new Error(path + ' ' + j.statusMessage);
  return j.response;
}
const nums = p => (p && p.number || []).map(n => n.value).sort();
function compact(r) {
  const d = r.data;
  return {
    date: r.date,
    video: r.youtube_url || '',
    first: nums(d.first)[0],
    near1: nums(d.near1),
    front3: nums(d.last3f),
    last3: nums(d.last3b),
    last2: nums(d.last2)[0],
    second: nums(d.second),
    third: nums(d.third),
    fourth: nums(d.fourth),
    fifth: nums(d.fifth)
  };
}
async function thai() {
  const year = new Date().getFullYear();
  let dates = [];
  for (const y of [year, year - 1]) {
    const res = await post('lottery/getPeriodsByYear', { year: String(y), type: 'CHECKED' });
    dates.push(...(res.result || []).map(p => p.date));
    if (new Set(dates).size >= KEEP) break;
  }
  dates = [...new Set(dates)].sort().reverse().slice(0, KEEP);
  const draws = [];
  for (const date of dates) {
    const [y, m, d] = date.split('-');
    const res = await post('lottery/getLotteryAward', { date: d, month: m, year: y });
    if (res && res.data && res.data.first) draws.push(compact(res));
  }
  if (!draws.length) throw new Error('ไม่ได้ข้อมูลผลรางวัล');
  return draws;
}

// ===== หวยลาว =====
// แต่ละงวด: วันที่ [นามสัตว์] 6 ตัว ... 5 ตัว ... 4 ตัว ... 3 ตัว ... 2 (ตัว)บน ... 2 (ตัว)ล่าง ...
async function lao() {
  const t = text(await get('https://check-lottery.com/laos_lotto.php'));
  const re = new RegExp(TH_DATE + ' ([^0-9]{0,40}?)\\s*(?:เลข )?6 ตัว (\\d{6}) 5 ตัว (\\d{5}) 4 ตัว (\\d{4}) 3 ตัว (\\d{3}) 2 (?:ตัว)?บน (\\d{2}) 2 (?:ตัว)?ล่าง (\\d{2})(?: นามสัตว์ (\\S+))?', 'g');
  const out = [];
  let m;
  while ((m = re.exec(t))) {
    const date = isoTh(m[1], m[2], m[3]), animal = (m[11] || m[4] || '').replace(/[^฀-๿]/g, '');
    if (!out.some(r => r.date === date)) out.push({ date, n6: m[5], top2: m[9], bot2: m[10], animal });
  }
  if (!out.length) throw new Error('lao: ไม่พบผล (หน้าเว็บอาจเปลี่ยน)');
  return out;
}

// ===== หวยฮานอย (เฉพาะกิจ / พิเศษ / ปกติ / VIP) =====
const HANOI = { 'เฉพาะกิจ': 'fx', 'พิเศษ': 'sp', 'ปกติ': 'nm', 'VIP': 'vip' };
async function hanoi() {
  const t = text(await get('https://check-lottery.com/hanoi_lotto.php'));
  const days = t.split(/📅/).slice(1), out = [];
  days.forEach(seg => {
    const dm = new RegExp('^\\s*' + TH_DATE).exec(seg);
    if (!dm) return;
    const r = { date: isoTh(dm[1], dm[2], dm[3]) }, re = /(เฉพาะกิจ|พิเศษ|ปกติ|VIP) (\d{4}) 3 บน (\d{3}) 2 บน (\d{2}) 2 ล่าง (\d{2})/g;
    let m, n = 0;
    while ((m = re.exec(seg))) { r[HANOI[m[1]]] = { n4: m[2], bot2: m[5] }; n++; }
    if (n && !out.some(x => x.date === r.date)) out.push(r);
  });
  if (!out.length) throw new Error('hanoi: ไม่พบผล (หน้าเว็บอาจเปลี่ยน)');
  return out;
}

// ===== หวยหุ้น (ดัชนีปิดตลาด) =====
// เก็บดัชนีปิดและค่าเปลี่ยนแปลง (ทศนิยม 2 ตำแหน่ง) — ป๊อปอัปคิด 3 ตัวบน / 2 ตัวล่าง จากตัวเลขนี้
const STOCKS = [
  ['set', '^SET.BK'], ['nikkei', '^N225'], ['hsi', '^HSI'], ['china', '000001.SS'], ['korea', '^KS11'],
  ['taiwan', '^TWII'], ['sing', '^STI'], ['india', '^BSESN'], ['uk', '^FTSE'], ['germany', '^GDAXI'], ['dow', '^DJI']
];
async function stockOne(sym) {
  const j = JSON.parse(await get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1d&interval=1d'));
  const m = j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
  if (!m || m.regularMarketPrice == null || m.chartPreviousClose == null) throw new Error(sym + ': ไม่มีข้อมูล');
  const off = m.gmtoffset * 1000, rmt = m.regularMarketTime * 1000, end = m.currentTradingPeriod.regular.end * 1000;
  const tod = t => (t + off) % 864e5; // เวลาของวัน (ตามเวลาท้องถิ่นตลาด)
  // ถือว่าปิดตลาดแล้ว: ราคาล่าสุดเกิดตอน/หลังเวลาปิดตลาด และไม่ขยับมาแล้ว 20 นาที (กันช่วงพักเที่ยงของตลาดเอเชีย)
  if (tod(rmt) < tod(end) - 5 * 6e4 || Date.now() - rmt < 20 * 6e4) return null;
  const close = Math.round(m.regularMarketPrice * 100) / 100, prev = Math.round(m.chartPreviousClose * 100) / 100;
  return { date: new Date(rmt + off).toISOString().slice(0, 10), close: close.toFixed(2), chg: (close - prev).toFixed(2) };
}
async function stock(old) {
  const out = {}, errs = [];
  for (const [key, sym] of STOCKS) {
    try {
      const r = await stockOne(sym);
      out[key] = merge(r ? [r] : [], old && old[key], KEEP_DAILY);
    } catch (e) { errs.push(e.message); out[key] = (old && old[key]) || []; }
  }
  if (errs.length === STOCKS.length) throw new Error('stock: ' + errs[0]);
  errs.forEach(e => console.warn('::warning::stock ' + e));
  return out;
}

// ===== สลากออมสิน / ธ.ก.ส. (ตารางผลย้อนหลังของ imhuay.com) =====
async function gsb() {
  const t = text(await get('https://www.imhuay.com/gsblotto'));
  const re = new RegExp(TH_DATE + ' (\\d{7}) (\\d{7}) (\\d{4}|-) (\\d{3}|-)', 'g'), out = [];
  let m;
  while ((m = re.exec(t))) out.push({ date: isoTh(m[1], m[2], m[3]), first: m[4], second: m[5], last4: m[6] === '-' ? '' : m[6], last3: m[7] === '-' ? '' : m[7] });
  if (!out.length) throw new Error('gsb: ไม่พบผล (หน้าเว็บอาจเปลี่ยน)');
  return out;
}
async function baac() {
  const t = text(await get('https://www.imhuay.com/baaclotto'));
  const re = new RegExp(TH_DATE + ' (\\d{7}) (\\d{3}) (\\d{2})(?!\\d)', 'g'), out = [];
  let m;
  while ((m = re.exec(t))) out.push({ date: isoTh(m[1], m[2], m[3]), first: m[4], top3: m[5], bot2: m[6] });
  if (!out.length) throw new Error('baac: ไม่พบผล (หน้าเว็บอาจเปลี่ยน)');
  return out;
}

// ===== หวยมาเลย์ (Magnum 4D) =====
async function malay() {
  const t = text(await get('https://www.check4d.org/'));
  const m = /Magnum 4D[^0-9]*Date: (\d\d)-(\d\d)-(\d{4})[^0-9]*Draw No: (\S+) 1st Prize \S* (\d{4}) 2nd Prize \S* (\d{4}) 3rd Prize \S* (\d{4}) Special \S* ((?:(?:\d{4}|-+|\*+) ){10,13})Consolation \S* ((?:\d{4} ?){10})/.exec(t);
  if (!m) throw new Error('malay: ไม่พบผล Magnum 4D (หน้าเว็บอาจเปลี่ยน)');
  const four = s => s.trim().split(' ').filter(x => /^\d{4}$/.test(x));
  return [{ date: m[3] + '-' + m[2] + '-' + m[1], drawNo: m[4], first: m[5], second: m[6], third: m[7], special: four(m[8]), cons: four(m[9]) }];
}

// ===== รวมทั้งหมด =====
(async () => {
  let old = {};
  try { old = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
  const out = {}, failed = [];
  const run = async (key, fn, keep) => {
    try {
      const fresh = await fn(old[key]);
      out[key] = keep ? merge(fresh, old[key], keep) : fresh;
    } catch (e) {
      failed.push(key);
      console.warn('::warning::' + key + ' ดึงไม่สำเร็จ ใช้ผลเดิม — ' + (e.message || e));
      if (old[key]) out[key] = old[key];
    }
  };
  await run('draws', thai);
  await run('lao', lao, KEEP_DAILY);
  await run('hanoi', hanoi, KEEP_DAILY);
  await run('stock', stock);
  await run('gsb', gsb, KEEP);
  await run('baac', baac, KEEP);
  await run('malay', malay, KEEP_DAILY);
  if (!out.draws) throw new Error('ไม่มีผลหวยรัฐบาลเลย (ทั้งของใหม่และของเดิม)');

  // ไม่ใส่เวลาที่รัน เพื่อให้ไฟล์เปลี่ยน (และ commit) เฉพาะตอนผลรางวัลเปลี่ยนจริง
  fs.writeFileSync(FILE, JSON.stringify(out));
  const last = k => out[k] && out[k][0] ? out[k][0].date : '-';
  console.log('lotto.json: รัฐบาล', last('draws'), '· ลาว', last('lao'), '· ฮานอย', last('hanoi'),
    '· ออมสิน', last('gsb'), '· ธ.ก.ส.', last('baac'), '· มาเลย์', last('malay'),
    '· หุ้น', Object.keys(out.stock || {}).map(k => k + ':' + ((out.stock[k][0] || {}).date || '-')).join(' '));
  if (failed.length) console.warn('ดึงไม่สำเร็จ:', failed.join(', '));
})().catch(e => { console.error(e); process.exit(1); });
