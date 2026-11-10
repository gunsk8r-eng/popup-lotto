/* ===== ป๊อปอัป RTP สล็อต (popup-rtpslot) =====
   แสดงค่า RTP ที่ค่ายเกมประกาศไว้ (ค่าทางทฤษฎี ไม่ใช่ค่าสด)
   ใช้: วางโค้ดทั้งไฟล์ในช่อง JS ของเว็บ หรือแท็ก script src="/popup-rtpslot.js" defer
   ตั้งค่า (ไม่บังคับ) วางก่อนโค้ดนี้:
     window.RTP_OPT = { side: 'right', top: 50, btnText: 'RTP สล็อต' };
   เพิ่มเกมของค่ายอื่นเอง (ดูค่า RTP ได้ในหน้าข้อมูลเกม/ตารางจ่ายของแต่ละเกม):
     window.RTP_EXTRA = { pp: [['Gates of Olympus', 96.5, '5000x', 'ลิงก์รูป (ไม่บังคับ)']], xo: [...], ns: [...], rs: [...] };
*/
(function () {
  var OPT = window.RTP_OPT || {}, EXTRA = window.RTP_EXTRA || {};
  var CFG = { side: OPT.side === 'left' ? 'left' : 'right', top: +OPT.top || 50, btnText: OPT.btnText || 'RTP สล็อต', btnIcon: OPT.btnIcon || '🎰' };

  // ===== ข้อมูล PG Soft จาก pgsoft.com (maxrtp) — ชื่อ|RTP|ชนะสูงสุด|ไอคอน คั่นด้วย ; เรียงจากเกมใหม่ไปเก่า =====
  var PG_DATE = '@@PG_DATE@@', PG = '@@PG_DATA@@';
  var PG_IMG = 'https://www.pgsoft.com/uploads/Games/Images/';

  var PROV = [
    ['pg', 'PG Soft', 'pgsoft.com'], ['pp', 'Pragmatic Play', ''], ['xo', 'SlotXO', ''], ['ns', 'Nextspin', ''], ['rs', 'RoyalSlot', '']
  ];
  function games(k) {
    if (k === 'pg') return PG.split(';').map(function (s, i) { var a = s.split('|'); return { n: a[0], r: +a[1], w: a[2], img: a[3] ? PG_IMG + a[3] : '', i: i }; });
    return (EXTRA[k] || []).map(function (a, i) { return { n: a[0], r: +a[1], w: a[2] || '', img: a[3] || '', i: i }; });
  }

  var CSS = [
    '#rtW{position:fixed;top:' + CFG.top + '%;' + CFG.side + ':0;z-index:99997;transform:translateY(-50%)}',
    '#rtB{display:block;padding:12px 8px;border:0;border-' + (CFG.side === 'right' ? 'left' : 'right') + ':3px solid #7df3ff;border-radius:' + (CFG.side === 'right' ? '14px 0 0 14px' : '0 14px 14px 0') + ';',
    '  background:linear-gradient(180deg,#5b2bd6,#2a0f7a);color:#fff!important;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 4px 14px #0005}',
    '#rtB i{display:block;font-style:normal;font-size:18px;text-align:center}',
    '#rtB span{display:block;margin-top:4px;writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:1px}',
    '#rtO{position:fixed;inset:0;z-index:99999;background:#0009;opacity:0;visibility:hidden;transition:.3s}',
    '#rtO.on{opacity:1;visibility:visible}',
    '#rtP{position:absolute;top:50%;' + CFG.side + ':12px;width:min(440px,calc(100% - 24px));max-height:90vh;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;',
    '  background:#f6f4ff;box-shadow:0 20px 50px #0007;transform:translate(' + (CFG.side === 'right' ? '115%' : '-115%') + ',-50%);transition:transform .5s cubic-bezier(.3,1.3,.5,1)}',
    '#rtO.on #rtP{transform:translate(0,-50%)}',
    '#rtH{position:relative;padding:14px 14px 10px;background:linear-gradient(135deg,#2a0f7a,#5b2bd6 60%,#8a5cff);color:#fff!important}',
    '#rtH b{display:block;font-size:19px;color:#fff!important}',
    '#rtH small{display:block;font-size:12px;color:#d9ccff!important}',
    '#rtX{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:#fff3;color:#fff!important;cursor:pointer}',
    '#rtT{display:flex;gap:6px;margin-top:10px;overflow-x:auto;scrollbar-width:none}',
    '#rtT::-webkit-scrollbar{display:none}',
    '#rtT button{flex:none;padding:5px 11px;border:1px solid #fff6;border-radius:99px;background:#0002;color:#fff!important;font:inherit;font-size:13px;white-space:nowrap;cursor:pointer}',
    '#rtT .on{border-color:#7df3ff;background:#7df3ff;color:#2a0f7a!important;font-weight:700}',
    '#rtF{display:flex;gap:6px;margin-top:10px}',
    '#rtF input,#rtF select{min-width:0;padding:8px 10px;border:0;border-radius:10px;background:#fff;color:#222!important;font:inherit;font-size:15px}',
    '#rtF input{flex:1}',
    '#rtC{overflow:auto;padding:8px 12px 12px;color:#222!important}',
    '#rtC :is(p,span,div,b,small,em){color:inherit}',
    '.rtR{display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:6px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px #e4ddff}',
    '.rtR img,.rtR .ph{flex:none;width:44px;height:44px;border-radius:10px;object-fit:cover;background:#e9e3ff}',
    '.rtR .ph{display:flex;align-items:center;justify-content:center;font-weight:700;color:#5b2bd6!important}',
    '.rtR div{flex:1;min-width:0}',
    '.rtR b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}',
    '.rtR small{display:block;font-size:12px;color:#777!important}',
    '.rtR i{display:block;height:6px;margin-top:4px;border-radius:3px;background:#eee;overflow:hidden}',
    '.rtR i u{display:block;height:100%;background:linear-gradient(90deg,#8a5cff,#2ad1e6)}',
    '.rtR em{flex:none;font-style:normal;font-weight:700;font-size:17px;color:#2a0f7a!important;font-variant-numeric:tabular-nums}',
    '.rtE{padding:24px 6px;text-align:center;color:#888!important;font-size:14px;line-height:1.6}',
    '.rtN{margin:8px 2px 0;font-size:12px;line-height:1.55;color:#777!important}'
  ].join('');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function go() {
    var d = document, st = d.createElement('style'), w = d.createElement('div');
    st.textContent = CSS; d.head.appendChild(st);
    w.innerHTML = '<div id="rtW"><button id="rtB" aria-label="ค่า RTP สล็อต"><i>' + CFG.btnIcon + '</i><span>' + esc(CFG.btnText) + '</span></button></div>' +
      '<div id="rtO" role="dialog" aria-modal="true" aria-label="ค่า RTP สล็อต"><div id="rtP"><div id="rtH"><b>ค่า RTP สล็อต</b><small>ค่าที่ค่ายเกมประกาศ (สูงสุด)</small>' +
      '<button id="rtX" aria-label="ปิด">✕</button><div id="rtT">' + PROV.map(function (p) { return '<button data-k="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div id="rtF"><input id="rtQ" type="search" placeholder="ค้นหาชื่อเกม" autocomplete="off"><select id="rtS" aria-label="เรียงลำดับ"><option value="r">RTP สูงสุด</option><option value="n">เกมใหม่</option><option value="a">ชื่อ A–Z</option></select></div>' +
      '</div><div id="rtC"></div></div></div>';
    d.body.appendChild(w);
    var g = function (i) { return d.getElementById(i); }, O = g('rtO'), C = g('rtC'), prov = 'pg';

    function render() {
      var list = games(prov), q = g('rtQ').value.trim().toLowerCase(), s = g('rtS').value, p = PROV.filter(function (x) { return x[0] === prov; })[0];
      if (q) list = list.filter(function (x) { return x.n.toLowerCase().indexOf(q) >= 0; });
      list.sort(s === 'r' ? function (a, b) { return b.r - a.r || a.i - b.i; } : s === 'a' ? function (a, b) { return a.n.localeCompare(b.n); } : function (a, b) { return a.i - b.i; });
      var h;
      if (!games(prov).length) h = '<p class="rtE">ยังไม่มีข้อมูล RTP ของ ' + p[1] + '<br>ค่ายนี้ไม่ได้เผยแพร่ค่า RTP เป็นรายการทางการ</p>';
      else if (!list.length) h = '<p class="rtE">ไม่พบเกมที่ค้นหา</p>';
      else h = list.map(function (x) {
        var pct = Math.max(0, Math.min(100, (x.r - 90) * 12.5)); // แถบ: 90% = ว่าง, 98% = เต็ม
        return '<div class="rtR">' + (x.img ? '<img loading="lazy" alt="" src="' + esc(x.img) + '">' : '<span class="ph">' + esc(x.n.charAt(0)) + '</span>') +
          '<div><b>' + esc(x.n) + '</b>' + (x.w ? '<small>ชนะสูงสุด ' + esc(x.w) + '</small>' : '') + '<i><u style="width:' + pct + '%"></u></i></div><em>' + x.r.toFixed(2) + '%</em></div>';
      }).join('');
      C.innerHTML = h + '<p class="rtN">' + (games(prov).length ? games(prov).length + ' เกม' + (p[2] ? ' · ที่มา ' + p[2] + (prov === 'pg' ? ' (ข้อมูล ณ ' + PG_DATE + ')' : '') : '') + '<br>' : '') +
        'RTP คือค่าทางทฤษฎีจากการเล่นจำนวนมหาศาล ไม่ใช่โอกาสชนะในแต่ละครั้ง และไม่เปลี่ยนตามช่วงเวลา · ' +
        'ตัวเลขนี้คือค่าสูงสุดที่ค่ายประกาศ เว็บที่ให้บริการอาจตั้งเวอร์ชัน RTP ต่ำกว่านี้ ตรวจได้ในหน้าข้อมูลของแต่ละเกม · เล่นอย่างมีสติ 18+</p>';
      [].forEach.call(C.querySelectorAll('img'), function (im) { im.onerror = function () { var s = d.createElement('span'); s.className = 'ph'; s.textContent = '🎰'; im.replaceWith(s); }; });
    }
    function setProv(k) {
      prov = k;
      [].forEach.call(d.querySelectorAll('#rtT button'), function (b) { b.className = b.getAttribute('data-k') === k ? 'on' : ''; });
      render(); C.scrollTop = 0;
    }
    function open() { O.className = 'on'; render(); }
    function close() { O.className = ''; }

    g('rtB').onclick = open;
    g('rtX').onclick = close;
    O.onclick = function (e) { if (e.target === O) close(); };
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && O.className) close(); });
    g('rtQ').oninput = render; g('rtS').onchange = render;
    [].forEach.call(d.querySelectorAll('#rtT button'), function (b) { b.onclick = function () { setProv(b.getAttribute('data-k')); }; });
    setProv('pg');
  }

  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
