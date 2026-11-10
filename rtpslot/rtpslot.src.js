/* ===== ป๊อปอัป RTP สล็อต (popup-rtpslot) =====
   แสดงค่า RTP ที่ค่ายเกมประกาศไว้ (ค่าทางทฤษฎี ไม่ใช่ค่าสด)
   ใช้: วางโค้ดทั้งไฟล์ในช่อง JS ของเว็บ หรือแท็ก script src="/popup-rtpslot.js" defer
   ตั้งค่า (ไม่บังคับ) วางก่อนโค้ดนี้:
     window.RTP_OPT = { side: 'right', top: 50, btnText: 'RTP สล็อต' };
   เพิ่มเกมของค่ายอื่นเอง (ดูค่า RTP ได้ในหน้าข้อมูลเกม/ตารางจ่ายของแต่ละเกม):
     window.RTP_EXTRA = { xo: [['ชื่อเกม', 96.5, '5000x', 'ลิงก์รูป (ไม่บังคับ)']], ns: [...], rs: [...] };
*/
(function () {
  var OPT = window.RTP_OPT || {}, EXTRA = window.RTP_EXTRA || {};
  var CFG = { top: +OPT.top || 50, btnText: OPT.btnText || 'RTP สล็อต', btnIcon: OPT.btnIcon || '🎰' };

  // ===== ข้อมูล PG Soft จาก pgsoft.com (maxrtp) — ชื่อ|RTP|ชนะสูงสุด|ไอคอน คั่นด้วย ; เรียงจากเกมใหม่ไปเก่า =====
  var PG_DATE = '@@PG_DATE@@', PG = '@@PG_DATA@@';
  var PG_IMG = 'https://www.pgsoft.com/uploads/Games/Images/';
  // ===== ข้อมูล Pragmatic Play จาก pragmaticplay.com (RTP ในหน้าแต่ละเกม) — ชื่อ|RTP คั่นด้วย ; =====
  var PP_DATE = '@@PP_DATE@@', PP = '@@PP_DATA@@', PP_IMG = 'https://www.pragmaticplay.com/wp-content/uploads/';
  // ไอคอนอยู่ในไฟล์แยก popup-rtpslot-icons.js (window.RTP_PP_ICONS = { ชื่อเกม: รูป }) — ไม่มีไฟล์นั้นก็ใช้รูปจากเว็บ Pragmatic

  var PROV = [
    ['pg', 'PG Soft', 'pgsoft.com'], ['pp', 'Pragmatic Play', 'pragmaticplay.com'], ['xo', 'SlotXO', ''], ['ns', 'Nextspin', ''], ['rs', 'RoyalSlot', '']
  ];
  function games(k) {
    var ex = (EXTRA[k] || []).map(function (a, i) { return { n: a[0], r: +a[1], w: a[2] || '', img: a[3] || '', i: -1 - i }; });
    if (k === 'pp' && PP) return ex.concat(PP.split(';').map(function (s, i) { var a = s.split('|'); return { n: a[0], r: +a[1], w: a[2] || '', img: (window.RTP_PP_ICONS || {})[a[0]] || (a[3] ? PP_IMG + a[3] : ''), i: i }; }));
    if (k === 'pg') return PG.split(';').map(function (s, i) { var a = s.split('|'); return { n: a[0], r: +a[1], w: a[2], img: a[3] ? PG_IMG + a[3] : '', i: i }; });
    return (EXTRA[k] || []).map(function (a, i) { return { n: a[0], r: +a[1], w: a[2] || '', img: a[3] || '', i: i }; });
  }

  var CSS = [
    // ปุ่มข้างจอ (ค่าเริ่มต้นชิดขวา, .l = ชิดซ้าย) ลากย้ายขึ้นลง/สลับซ้ายขวาได้
    '#rtW{position:fixed;top:' + CFG.top + '%;right:0;z-index:99997;transform:translateY(-50%);touch-action:none}',
    '#rtW.l{right:auto;left:0}',
    '#rtB{position:relative;display:block;overflow:hidden;padding:12px 8px;border:0;border-left:3px solid #7df3ff;border-radius:14px 0 0 14px;',
    '  background:linear-gradient(180deg,#7b45ff,#2a0f7a);color:#fff!important;font:inherit;font-weight:700;cursor:grab;animation:rtGlow 2s ease-in-out infinite}',
    '#rtW.l #rtB{border-left:0;border-right:3px solid #7df3ff;border-radius:0 14px 14px 0}',
    '#rtW.drag #rtB{cursor:grabbing;animation:none;box-shadow:0 10px 26px #0008}',
    '#rtB i{display:block;font-style:normal;font-size:20px;text-align:center;animation:rtWig 3s ease-in-out infinite}',
    '#rtB span{display:block;margin-top:4px;writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:1px}',
    // แสงวิ่งผ่านปุ่ม
    '#rtB::after{content:"";position:absolute;top:-50%;left:-60%;width:40%;height:200%;background:linear-gradient(90deg,transparent,#fff8,transparent);transform:rotate(20deg);animation:rtShine 3s ease-in-out infinite}',
    // ป้าย "ดู RTP" เด้งๆ
    '#rtTag{position:absolute;top:-12px;right:100%;margin-right:-6px;padding:2px 7px;border-radius:99px;background:#ff3d7f;color:#fff!important;font-size:11px;font-weight:700;white-space:nowrap;animation:rtBounce 1.6s ease-in-out infinite;pointer-events:none}',
    '#rtW.l #rtTag{right:auto;left:100%;margin:0 0 0 -6px}',
    '#rtHd{position:absolute;bottom:-9px;left:-9px;z-index:1;width:22px;height:22px;padding:0;border:2px solid #fff;border-radius:50%;background:#333;color:#fff!important;font-size:11px;line-height:1;cursor:pointer}',
    '#rtW.l #rtHd{left:auto;right:-9px}',
    '@keyframes rtGlow{0%,100%{box-shadow:0 0 0 0 #8a5cffaa,0 4px 14px #0005}50%{box-shadow:0 0 0 10px #8a5cff00,0 4px 14px #0005}}',
    '@keyframes rtShine{0%,60%{left:-60%}100%{left:130%}}',
    '@keyframes rtWig{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-15deg)}90%{transform:rotate(15deg)}95%{transform:rotate(-8deg)}}',
    '@keyframes rtBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    '@media (prefers-reduced-motion:reduce){#rtW *,#rtW *::after{animation:none!important}.rtR i u{transition:none!important}}',
    '#rtO{position:fixed;inset:0;z-index:99999;background:#0009;opacity:0;visibility:hidden;transition:.3s}',
    '#rtO.on{opacity:1;visibility:visible}',
    '#rtP{position:absolute;top:50%;right:12px;width:min(440px,calc(100% - 24px));max-height:90vh;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;',
    '  background:#f6f4ff;box-shadow:0 20px 50px #0007;transform:translate(115%,-50%);transition:transform .5s cubic-bezier(.3,1.3,.5,1)}',
    '#rtO.l #rtP{right:auto;left:12px;transform:translate(-115%,-50%)}',
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
    '.rtR i u{display:block;width:0;height:100%;background:linear-gradient(90deg,#8a5cff,#2ad1e6);transition:width 1s cubic-bezier(.2,.8,.3,1)}',
    '.rtR em{flex:none;font-style:normal;font-weight:700;font-size:17px;color:#2a0f7a!important;font-variant-numeric:tabular-nums}',
    '.rtE{padding:24px 6px;text-align:center;color:#888!important;font-size:14px;line-height:1.6}',
    '.rtN{margin:8px 2px 0;font-size:12px;line-height:1.55;color:#777!important}'
  ].join('');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function go() {
    var d = document, st = d.createElement('style'), w = d.createElement('div');
    st.textContent = CSS; d.head.appendChild(st);
    w.innerHTML = '<div id="rtW"><span id="rtTag">ดู RTP</span><button id="rtB" aria-label="ค่า RTP สล็อต (ลากเพื่อย้ายได้)" title="กดเพื่อดู RTP · ลากเพื่อย้าย"><i>' + CFG.btnIcon + '</i><span>' + esc(CFG.btnText) + '</span></button>' +
      '<button id="rtHd" aria-label="ปิดปุ่ม RTP" title="ปิด (รีเฟรชแล้วกลับมา)">✕</button></div>' +
      '<div id="rtO" role="dialog" aria-modal="true" aria-label="ค่า RTP สล็อต"><div id="rtP"><div id="rtH"><b>ค่า RTP สล็อต</b><small>ค่าที่ค่ายเกมประกาศ (สูงสุด)</small>' +
      '<button id="rtX" aria-label="ปิด">✕</button><div id="rtT">' + PROV.map(function (p) { return '<button data-k="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div id="rtF"><input id="rtQ" type="search" placeholder="ค้นหาชื่อเกม" autocomplete="off"><select id="rtS" aria-label="เรียงลำดับ"><option value="r">RTP สูงสุด</option><option value="n">เกมใหม่</option><option value="a">ชื่อ A–Z</option></select></div>' +
      '</div><div id="rtC"></div></div></div>';
    d.body.appendChild(w);
    var g = function (i) { return d.getElementById(i); }, O = g('rtO'), C = g('rtC'), prov = 'pg';

    // ตัวเลข % นับขึ้นจาก 0 ไปหยุดที่ค่าจริง + แถบค่อยๆ เติม (เล่นตอนเปิด/เปลี่ยนค่าย/เปลี่ยนการเรียง)
    var raf;
    function countUp() {
      cancelAnimationFrame(raf);
      var ems = [].slice.call(C.querySelectorAll('.rtR em')), bars = C.querySelectorAll('.rtR i u'), t0 = 0, dur = 1100;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0;
      [].forEach.call(bars, function (u) { u.style.width = '0'; });
      void C.offsetWidth;
      [].forEach.call(bars, function (u) { u.style.width = u.getAttribute('data-w') + '%'; });
      (function step(t) {
        if (!t0) t0 = t;
        var k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        ems.forEach(function (el) { el.textContent = (+el.getAttribute('data-r') * e).toFixed(2) + '%'; });
        if (k < 1) raf = requestAnimationFrame(step);
      })(performance.now());
    }
    function render(anim) {
      var list = games(prov), q = g('rtQ').value.trim().toLowerCase(), s = g('rtS').value, p = PROV.filter(function (x) { return x[0] === prov; })[0];
      g('rtS').options[1].text = prov === 'pp' ? 'ยอดนิยม' : 'เกมใหม่';
      if (q) list = list.filter(function (x) { return x.n.toLowerCase().indexOf(q) >= 0; });
      list.sort(s === 'r' ? function (a, b) { return b.r - a.r || a.i - b.i; } : s === 'a' ? function (a, b) { return a.n.localeCompare(b.n); } : function (a, b) { return a.i - b.i; });
      var h;
      if (!games(prov).length) h = '<p class="rtE">ยังไม่มีข้อมูล RTP ของ ' + p[1] + '<br>ค่ายนี้ไม่ได้เผยแพร่ค่า RTP เป็นรายการทางการ</p>';
      else if (!list.length) h = '<p class="rtE">ไม่พบเกมที่ค้นหา</p>';
      else h = list.map(function (x) {
        var pct = Math.max(0, Math.min(100, (x.r - 90) * 12.5)); // แถบ: 90% = ว่าง, 98% = เต็ม
        return '<div class="rtR">' + (x.img ? '<img loading="lazy" alt="" src="' + esc(x.img) + '">' : '<span class="ph">' + esc(x.n.charAt(0)) + '</span>') +
          '<div><b>' + esc(x.n) + '</b>' + (x.w ? '<small>ชนะสูงสุด ' + esc(x.w) + '</small>' : '') + '<i><u data-w="' + pct + '" style="width:' + pct + '%"></u></i></div><em data-r="' + x.r + '">' + x.r.toFixed(2) + '%</em></div>';
      }).join('');
      C.innerHTML = h + '<p class="rtN">' + (games(prov).length ? games(prov).length + ' เกม' + (p[2] ? ' · ที่มา ' + p[2] + (prov === 'pg' ? ' (ข้อมูล ณ ' + PG_DATE + ')' : prov === 'pp' && PP_DATE ? ' (ข้อมูล ณ ' + PP_DATE + ')' : '') : '') + '<br>' : '') +
        'RTP คือค่าทางทฤษฎีจากการเล่นจำนวนมหาศาล ไม่ใช่โอกาสชนะในแต่ละครั้ง และไม่เปลี่ยนตามช่วงเวลา · ' +
        'ตัวเลขนี้คือค่าสูงสุดที่ค่ายประกาศ เว็บที่ให้บริการอาจตั้งเวอร์ชัน RTP ต่ำกว่านี้ ตรวจได้ในหน้าข้อมูลของแต่ละเกม · เล่นอย่างมีสติ 18+</p>';
      if (anim) countUp();
      // รูปโหลดไม่ได้ หรือได้รูปว่าง 1×1 (เว็บต้นทางกันการดึงรูปไปใช้) → แสดง 🎰 แทน
      [].forEach.call(C.querySelectorAll('img'), function (im) {
        var bad = function () { if (!im.parentNode) return; var s = d.createElement('span'); s.className = 'ph'; s.textContent = '🎰'; im.replaceWith(s); };
        im.onerror = bad; im.onload = function () { if (im.naturalWidth < 2) bad(); };
        if (im.complete && im.naturalWidth && im.naturalWidth < 2) bad();
      });
    }
    function setProv(k) {
      prov = k;
      [].forEach.call(d.querySelectorAll('#rtT button'), function (b) { b.className = b.getAttribute('data-k') === k ? 'on' : ''; });
      render(O.className.indexOf('on') >= 0); C.scrollTop = 0;
    }
    function open() { O.className = 'on' + (W.classList.contains('l') ? ' l' : ''); render(true); }
    function close() { O.className = W.classList.contains('l') ? 'l' : ''; }

    // ===== ปุ่มข้างจอ: ลากย้าย (จำตำแหน่ง) / กด ✕ ซ่อนเฉพาะหน้านี้ รีเฟรชแล้วกลับมา =====
    var W = g('rtW'), B = g('rtB'), drag = null, justDragged = false;
    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }
    if (OPT.side === 'left') W.classList.add('l');
    try { var pos = JSON.parse(ls('rtPos') || 'null'); if (pos) { W.classList.toggle('l', !!pos.l); W.style.top = pos.t + '%'; } } catch (e) {}
    B.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, moved: false }; try { B.setPointerCapture(e.pointerId); } catch (x) {} });
    B.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.moved = true; W.classList.add('drag');
      W.style.top = Math.min(Math.max(e.clientY, 60), innerHeight - 60) + 'px';
      W.classList.toggle('l', e.clientX < innerWidth / 2);
    });
    function endDrag() {
      if (drag && drag.moved) {
        var t = parseFloat(W.style.top) / innerHeight * 100;
        W.style.top = t.toFixed(1) + '%';
        ls('rtPos', JSON.stringify({ l: W.classList.contains('l'), t: +t.toFixed(1) }));
        justDragged = true;
      }
      drag = null; W.classList.remove('drag');
    }
    B.addEventListener('pointerup', endDrag);
    B.addEventListener('pointercancel', endDrag);
    B.onclick = function () { if (justDragged) { justDragged = false; return; } open(); };
    g('rtHd').onclick = function () { W.style.display = 'none'; };
    g('rtX').onclick = close;
    O.onclick = function (e) { if (e.target === O) close(); };
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && O.className) close(); });
    g('rtQ').oninput = function () { render(false); }; g('rtS').onchange = function () { render(true); };
    [].forEach.call(d.querySelectorAll('#rtT button'), function (b) { b.onclick = function () { setProv(b.getAttribute('data-k')); }; });
    setProv('pg');
  }

  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
