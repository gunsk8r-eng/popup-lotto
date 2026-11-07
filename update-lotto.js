// ดึงผลสลากกินแบ่งรัฐบาลจาก API ของกองสลาก (glo.or.th) แล้วเขียนเป็น lotto.json
// ให้ป๊อปอัปหวยอ่าน — GitHub Actions รันไฟล์นี้อัตโนมัติ (ดู .github/workflows/lotto.yml)
// รันเองได้ด้วย: node update-lotto.js
const fs = require('fs');
const API = 'https://www.glo.or.th/api/';
const KEEP = 12; // เก็บผลย้อนหลังกี่งวด

async function post(path, body) {
  const r = await fetch(API + path, {
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

(async () => {
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

  // ไม่ใส่เวลาที่รัน เพื่อให้ไฟล์เปลี่ยน (และ commit) เฉพาะตอนผลรางวัลเปลี่ยนจริง
  const out = { draws };
  fs.writeFileSync(__dirname + '/lotto.json', JSON.stringify(out));
  console.log('lotto.json:', draws.length, 'งวด, ล่าสุด', draws[0].date, 'รางวัลที่ 1', draws[0].first);
})().catch(e => { console.error(e); process.exit(1); });
