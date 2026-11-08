/* ===== ป๊อปอัปหวย (ผลสลาก / ตรวจหวย / ย้อนหลัง / นับถอยหลัง / เลขเด็ด / เด้งเองวันหวยออก) =====
   ใช้ได้ 2 แบบ
   1) วางโค้ดทั้งไฟล์ในช่อง JS ของเว็บ
   2) แท็กลิงก์ script src ไปที่ https://cdn.jsdelivr.net/gh/(บัญชี)/(repo)@main/lotto.js?lc=(ไลฟ์แชท)&fb=1 แบบ defer
      (ห้ามเขียนแท็กปิด script ไว้ในคอมเมนต์นี้ เพราะตอนวางในช่อง JS จะทำให้โค้ดพัง)
      ?lc=osiris168-com  → โหลดไลฟ์แชท https://osiris168-com.livechat.cv ให้ด้วย
      &fb=1              → โหลดตารางบอล (football.js) ให้ด้วย
      &auto=0            → ปิดการเด้งเองในวันหวยออก
*/
(function () {
  var me = document.currentScript, Q = function (k) {
    var m = me && me.src && new RegExp('[?&]' + k + '=([^&]+)').exec(me.src);
    return m ? decodeURIComponent(m[1]) : '';
  };

  // ถ้าโหลดผ่าน jsDelivr (cdn.jsdelivr.net/gh/<บัญชี>/<repo>@...) จะอ่าน lotto.json จาก repo เดียวกันให้เอง
  var gh = me && /cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^/@]+)/.exec(me.src || '');

  // ===== ตั้งค่า =====
  var CFG = {
    data: Q('data') || (gh ? 'https://raw.githubusercontent.com/' + gh[1] + '/' + gh[2] + '/main/lotto.json'
      : 'https://raw.githubusercontent.com/gunsk8r-eng/popup-lotto/main/lotto.json'), // ไฟล์ผลหวยที่ GitHub อัปเดตให้
    football: 'https://cdn.jsdelivr.net/gh/gunsk8r-eng/popup-football@main/football.js',
    autoOpen: Q('auto') !== '0',   // เด้งเองวันหวยออก (ครั้งเดียวต่อการเปิดเว็บ)
    btnIcon: '🎫',
    btnText: 'ผลหวย'
  };
  // ==================

  function addScript(src) { var s = document.createElement('script'); s.src = src; s.defer = true; document.head.appendChild(s); }
  if (/^[\w-]+$/.test(Q('lc'))) addScript('https://' + Q('lc') + '.livechat.cv/widget.js?version=v2');
  if (Q('fb') === '1') addScript(CFG.football);

  var PRIZE = [
    ['first', 'รางวัลที่ 1', 6000000, 6], ['near1', 'ข้างเคียงรางวัลที่ 1', 100000, 6],
    ['second', 'รางวัลที่ 2', 200000, 6], ['third', 'รางวัลที่ 3', 80000, 6],
    ['fourth', 'รางวัลที่ 4', 40000, 6], ['fifth', 'รางวัลที่ 5', 20000, 6],
    ['front3', 'เลขหน้า 3 ตัว', 4000, 3], ['last3', 'เลขท้าย 3 ตัว', 4000, -3], ['last2', 'เลขท้าย 2 ตัว', 2000, -2]
  ];

  var CSS = [
    // ปุ่มข้างจอ: ลากย้ายขึ้นลง/สลับซ้ายขวาได้ + ปุ่ม ✕ เล็กสำหรับซ่อน
    '#ltW{position:fixed;left:0;top:72%;z-index:99998;transform:translateY(-50%);touch-action:none}',
    '#ltW.r{left:auto;right:0}',
    '#ltB{position:relative;display:block;padding:12px 8px;border:0;border-right:3px solid #ffd36b;border-radius:0 14px 14px 0;',
    '  background:linear-gradient(180deg,#d4001f,#8a0012);color:#fff!important;font:inherit;font-weight:700;cursor:grab;box-shadow:3px 4px 14px #0005}',
    '#ltW.r #ltB{border-right:0;border-left:3px solid #ffd36b;border-radius:14px 0 0 14px}',
    '#ltW.drag #ltB{cursor:grabbing;box-shadow:0 10px 26px #0008}',
    '#ltB i{display:block;font-style:normal;font-size:18px;text-align:center}',
    '#ltB span{display:block;margin-top:4px;writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:1px}',
    // ย่อปุ่ม (กด ✕) เหลือแค่ไอคอนเล็กๆ ติดขอบจอ กดอีกครั้งเพื่อเปิดผลหวยได้เหมือนเดิม
    '#ltB.ltDot::after{content:"";position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ffd36b;box-shadow:0 0 0 2px #8a0012;animation:ltBlink 1s infinite}',
    '#ltHd{position:absolute;top:-9px;right:-9px;z-index:1;width:22px;height:22px;padding:0;border:2px solid #fff;border-radius:50%;background:#333;color:#fff!important;font-size:11px;line-height:1;cursor:pointer}',
    '#ltW.r #ltHd{right:auto;left:-9px}',
    '#ltO{position:fixed;inset:0;z-index:99999;background:#0009;opacity:0;visibility:hidden;transition:.35s}',
    '#ltO.on{opacity:1;visibility:visible}',
    '#ltP{position:absolute;left:12px;top:50%;width:min(420px,calc(100% - 24px));max-height:90vh;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;',
    '  background:#fffaf0;box-shadow:0 20px 50px #0007;transform:translate(-115%,-50%);transition:transform .55s cubic-bezier(.3,1.3,.5,1)}',
    '#ltO.on #ltP{transform:translate(var(--dx,0px),calc(-50% + var(--dy,0px)))}',
    '#ltP.drag{transition:none}',
    // จับแถบหัวป๊อปอัปเพื่อลากย้ายได้
    '#ltH{position:relative;padding:16px 16px 0;background:linear-gradient(135deg,#8a0012,#d4001f 60%,#ff5a3c);cursor:move;touch-action:none}',
    '#ltH::before{content:"";position:absolute;top:6px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:#fff7}',
    '#ltH button{cursor:pointer}',
    '#ltH b{display:block;font-size:20px;color:#fff!important}',
    '#ltCd{margin-top:6px;padding:6px 10px;border-radius:10px;background:#0003;font-size:13px;color:#ffe8a3!important}',
    '#ltCd strong{color:#fff!important;font-variant-numeric:tabular-nums}',
    '#ltX{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:#fff3;color:#fff!important;cursor:pointer}',
    '#ltH nav{display:flex;gap:4px;margin-top:10px}',
    '#ltH nav button{flex:1;padding:8px 2px;border:0;border-radius:10px 10px 0 0;background:#fff2;color:#fff!important;font:inherit;font-size:14px;cursor:pointer}',
    '#ltH nav .on{background:#fffaf0;color:#8a0012!important;font-weight:700}',
    '#ltC{overflow:auto;padding:12px 14px 16px;color:#3a1a00!important}',
    '#ltC :is(p,span,div,td,th,label,small,b,strong,em,h3){color:inherit}',
    '#ltC p{margin:0 0 8px}',
    '.ltE{padding:30px 0;text-align:center;color:#999!important}',
    '.ltDate{text-align:center;font-size:15px;font-weight:700;color:#8a0012!important;margin:0 0 6px}',
    '.ltNew{display:block;width:max-content;margin:0 auto 8px;padding:3px 12px;border-radius:99px;background:#d4001f;color:#fff!important;font-size:13px;animation:ltBlink 1.2s infinite}',
    '.ltFirst{padding:12px 8px 14px;border-radius:16px;text-align:center;background:linear-gradient(180deg,#fff3c4,#ffd36b);box-shadow:inset 0 0 0 2px #e0a800}',
    '.ltFirst small{display:block;font-size:13px;color:#8a5a00!important}',
    '.ltDig{display:flex;justify-content:center;gap:5px;margin-top:6px}',
    '.ltDig i{display:block;width:40px;height:52px;border-radius:9px;background:#8a0012;color:#fff!important;font:700 34px/52px monospace;font-style:normal;box-shadow:inset 0 -4px #0004}',
    '.ltGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
    '.ltBox{padding:9px 6px;border-radius:12px;background:#fff;text-align:center;box-shadow:0 0 0 1px #f0d9b0}',
    '.ltBox small{display:block;font-size:12px;color:#8a5a00!important}',
    '.ltBox b{display:block;margin-top:2px;font-size:22px;letter-spacing:2px;color:#8a0012!important}',
    '.ltBox.big b{font-size:34px}',
    '.ltBox.wide{grid-column:1/-1}',
    '.ltMore{display:block;width:100%;margin-top:10px;padding:8px;border:1px dashed #d4a050;border-radius:10px;background:none;color:#8a5a00!important;font:inherit;cursor:pointer}',
    '.ltAll h3{margin:12px 0 4px;font-size:14px;color:#8a0012!important}',
    '.ltAll div{display:flex;flex-wrap:wrap;gap:4px}',
    '.ltAll span{padding:2px 6px;border-radius:6px;background:#fff;box-shadow:0 0 0 1px #f0d9b0;font:13px monospace}',
    '.ltLink{display:block;margin-top:10px;text-align:center;font-size:13px;color:#d4001f!important}',
    '.ltIn{display:flex;gap:6px;margin:8px 0}',
    '.ltIn input,.ltSel{flex:1;min-width:0;padding:10px;border:1px solid #e0b870;border-radius:10px;background:#fff;color:#3a1a00!important;font:inherit;font-size:16px}',
    '.ltSel{width:100%}',
    '.ltGo{padding:10px 16px;border:0;border-radius:10px;background:#d4001f;color:#fff!important;font:inherit;font-weight:700;cursor:pointer}',
    '.ltRes{margin-top:8px;padding:10px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px #f0d9b0}',
    '.ltRes b{font:700 18px monospace;letter-spacing:2px}',
    '.ltRes.win{background:#fff3c4;box-shadow:0 0 0 2px #e0a800;animation:ltPop .5s cubic-bezier(.3,1.6,.5,1)}',
    '.ltRes.win em{display:block;font-style:normal;font-weight:700;color:#0a8a2a!important}',
    '.ltRes.lose em{display:block;font-style:normal;color:#999!important}',
    '.ltH{display:block;width:100%;margin-bottom:8px;padding:10px 12px;border:0;border-radius:12px;background:#fff;box-shadow:0 0 0 1px #f0d9b0;text-align:left;font:inherit;cursor:pointer}',
    '.ltH:hover{box-shadow:0 0 0 2px #e0a800}',
    '.ltH small{display:block;font-size:13px;color:#8a5a00!important}',
    '.ltH b{font:700 20px monospace;letter-spacing:2px;color:#8a0012!important}',
    '.ltH span{display:block;font-size:13px;color:#555!important}',
    '.ltSs{text-align:center}',
    '.ltCup{position:relative;width:120px;height:150px;margin:6px auto 0}',
    '.ltCup .cup{position:absolute;left:10px;bottom:0;width:100px;height:110px;border-radius:8px 8px 22px 22px;background:linear-gradient(90deg,#8a0012,#d4001f 45%,#8a0012);box-shadow:inset 0 0 0 3px #ffd36b}',
    '.ltCup .cup::after{content:"เซียมซี";position:absolute;inset:auto 0 38px;text-align:center;color:#ffd36b;font-weight:700}',
    '.ltCup i{position:absolute;bottom:80px;width:8px;height:70px;border-radius:4px;background:linear-gradient(#e8c47a,#b8863a);transform-origin:50% 100%}',
    '.ltCup.shake{animation:ltShake .12s linear 10}',
    '.ltStick{display:none;margin:10px auto 0;padding:12px;border-radius:14px;background:#fff3c4;box-shadow:0 0 0 2px #e0a800;animation:ltPop .6s cubic-bezier(.3,1.6,.5,1)}',
    '.ltStick.on{display:block}',
    '.ltStick b{display:inline-block;margin:0 6px;font:700 36px monospace;letter-spacing:3px;color:#8a0012!important}',
    '.ltNote{margin-top:10px!important;font-size:12px;color:#999!important}',
    '.ltConf{position:fixed;top:-20px;width:10px;height:14px;z-index:100000;pointer-events:none;animation:ltFall linear forwards}',
    '@keyframes ltBlink{50%{opacity:.4}}',
    '@keyframes ltPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}',
    '@keyframes ltShake{25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}',
    '@keyframes ltFall{to{transform:translateY(110vh) rotate(720deg)}}',
    '@media (prefers-reduced-motion:reduce){#ltO *{animation:none!important}}'
  ].join('');

  function go() {
    var d = document, st = d.createElement('style'), w = d.createElement('div');
    st.textContent = CSS; d.head.appendChild(st);
    w.innerHTML = '<div id="ltW"><button id="ltB" aria-label="ผลหวย (ลากเพื่อย้ายได้)" title="กดเพื่อดูผลหวย · ลากเพื่อย้าย"><i>' + CFG.btnIcon + '</i><span>' + CFG.btnText + '</span></button>' +
      '<button id="ltHd" aria-label="ปิดปุ่มผลหวย" title="ปิด (รีเฟรชแล้วกลับมา)">✕</button></div>' +
      '<div id="ltO" role="dialog" aria-modal="true" aria-label="ผลสลากกินแบ่งรัฐบาล"><div id="ltP"><div id="ltH"><b>ผลสลากกินแบ่งรัฐบาล</b>' +
      '<button id="ltX" aria-label="ปิด">✕</button><div id="ltCd"></div><nav>' +
      '<button data-t="r">ผลล่าสุด</button><button data-t="c">ตรวจหวย</button><button data-t="h">ย้อนหลัง</button><button data-t="s">เลขเด็ด</button>' +
      '</nav></div><div id="ltC"></div></div></div>';
    d.body.appendChild(w);

    var g = function (i) { return d.getElementById(i); }, O = g('ltO'), C = g('ltC'), B = g('ltB'), W = g('ltW'), P = g('ltP'),
      tab = 'r', cur = 0, data = null, timer, tick, ssNums = null;

    // ===== เวลา / วันหวยออก (เวลาไทย) =====
    var BKK = 7 * 36e5;
    function now() { return Date.now(); }
    function thDate(iso, opt) { return new Date(iso + 'T12:00:00Z').toLocaleDateString('th-TH', opt || { day: 'numeric', month: 'long', year: 'numeric' }); }
    function bkkDay(t) { return new Date(t + BKK).toISOString().slice(0, 10); }
    // วันออกรางวัลปกติ 1 และ 16 เวลา 16:00 (เลื่อน: 1 ม.ค.→30 ธ.ค., 16 ม.ค.→17 ม.ค., 1 พ.ค.→2 พ.ค.)
    function drawDays(y) {
      var out = [y - 1 + '-12-30'];
      for (var m = 1; m <= 12; m++) {
        var mm = (m < 10 ? '0' : '') + m;
        if (m > 1) out.push(y + '-' + mm + (m === 5 ? '-02' : '-01'));
        out.push(y + '-' + mm + (m === 1 ? '-17' : '-16'));
      }
      return out;
    }
    function drawTime(day) { return Date.parse(day + 'T09:00:00Z'); } // 16:00 เวลาไทย
    function nextDraw() {
      var y = new Date(now() + BKK).getUTCFullYear(), list = drawDays(y).concat(drawDays(y + 1)), t = now();
      for (var i = 0; i < list.length; i++) if (drawTime(list[i]) + 2 * 36e5 > t) return list[i]; // นับถึง 18:00 ของวันนั้น
    }
    function isDrawDay() { return nextDraw() === bkkDay(now()); }
    function hasToday() { return data && data.draws[0] && data.draws[0].date === bkkDay(now()); }

    function countdown() {
      var nd = nextDraw(), left = drawTime(nd) - now(), el = g('ltCd'), html;
      if (hasToday()) html = '🎉 ผลงวดวันนี้ออกแล้ว! · งวดถัดไป ' + thDate(nextAfterToday(), { day: 'numeric', month: 'short' });
      else if (left <= 0) html = '🔴 กำลังออกรางวัลงวด ' + thDate(nd, { day: 'numeric', month: 'short' }) + ' · รอผลสักครู่';
      else {
        var s = Math.floor(left / 1000), dd = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60), ss = s % 60, p = function (n) { return (n < 10 ? '0' : '') + n; };
        html = isDrawDay() ? '🔔 วันนี้หวยออก! ผลออก 16:00 น. อีก <strong>' + p(hh) + ':' + p(mi) + ':' + p(ss) + '</strong>' :
          '⏰ งวดถัดไป ' + thDate(nd, { day: 'numeric', month: 'short', year: '2-digit' }) + ' อีก <strong>' + (dd ? dd + ' วัน ' : '') + p(hh) + ':' + p(mi) + ':' + p(ss) + '</strong>';
      }
      el.innerHTML = html;
    }
    function nextAfterToday() {
      var y = new Date(now() + BKK).getUTCFullYear(), list = drawDays(y).concat(drawDays(y + 1)), today = bkkDay(now());
      for (var i = 0; i < list.length; i++) if (list[i] > today) return list[i];
    }

    // ===== ข้อมูล =====
    function load() {
      return fetch(CFG.data + (CFG.data.indexOf('?') < 0 ? '?' : '&') + 't=' + Math.floor(now() / 6e4))
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { var changed = !data || j.draws[0].date !== data.draws[0].date; data = j; return changed; });
    }

    // ===== หน้าต่างๆ =====
    function rFirst(n) { return n.split('').map(function (c) { return '<i>' + c + '</i>'; }).join(''); }
    function viewResult(roll) {
      var r = data.draws[cur], j = function (a) { return a.join(' &nbsp; '); };
      var h = (cur === 0 && hasToday() ? '<span class="ltNew">🎉 ผลออกแล้ววันนี้</span>' : '') +
        '<p class="ltDate">งวดวันที่ ' + thDate(r.date) + '</p>' +
        '<div class="ltFirst"><small>รางวัลที่ 1 · รางวัลละ 6,000,000 บาท</small><div class="ltDig" id="ltDig">' + rFirst(r.first) + '</div></div>' +
        '<div class="ltGrid"><div class="ltBox"><small>เลขหน้า 3 ตัว</small><b>' + j(r.front3) + '</b></div>' +
        '<div class="ltBox"><small>เลขท้าย 3 ตัว</small><b>' + j(r.last3) + '</b></div>' +
        '<div class="ltBox big wide"><small>เลขท้าย 2 ตัว</small><b>' + r.last2 + '</b></div>' +
        '<div class="ltBox wide"><small>ข้างเคียงรางวัลที่ 1</small><b>' + j(r.near1) + '</b></div></div>' +
        '<button class="ltMore" id="ltMore">ดูรางวัลที่ 2–5 ทั้งหมด ▾</button><div class="ltAll" id="ltAll" hidden>' +
        PRIZE.slice(2, 6).map(function (p) { return '<h3>' + p[1] + ' (' + r[p[0]].length + ' รางวัล · ' + p[2].toLocaleString() + ' บาท)</h3><div>' + r[p[0]].map(function (n) { return '<span>' + n + '</span>'; }).join('') + '</div>'; }).join('') + '</div>' +
        (r.video ? '<a class="ltLink" href="' + r.video + '" target="_blank" rel="noopener">▶ ดูวิดีโอการออกรางวัล (กองสลาก)</a>' : '');
      C.innerHTML = h;
      g('ltMore').onclick = function () { var a = g('ltAll'); a.hidden = !a.hidden; this.textContent = a.hidden ? 'ดูรางวัลที่ 2–5 ทั้งหมด ▾' : 'ซ่อน ▴'; };
      if (roll) rollDigits(r.first);
    }
    // เลขรางวัลที่ 1 หมุนแล้วหยุดทีละหลัก
    function rollDigits(n) {
      var box = g('ltDig'); if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var cells = box.children, start = now(), id = setInterval(function () {
        var t = now() - start, done = 0;
        for (var i = 0; i < cells.length; i++) {
          if (t > 400 + i * 220) { cells[i].textContent = n[i]; done++; } else cells[i].textContent = Math.floor(Math.random() * 10);
        }
        if (done === cells.length || !d.body.contains(box)) clearInterval(id);
      }, 50);
    }

    function viewCheck() {
      C.innerHTML = '<p>เลือกงวด แล้วกรอกเลขสลาก 6 หลัก (หลายใบ คั่นด้วยเว้นวรรค)</p>' +
        '<select class="ltSel" id="ltDraw">' + data.draws.map(function (r, i) { return '<option value="' + i + '">งวด ' + thDate(r.date) + '</option>'; }).join('') + '</select>' +
        '<div class="ltIn"><input id="ltNum" inputmode="numeric" placeholder="เช่น 423224 123456" autocomplete="off"><button class="ltGo" id="ltGo">ตรวจ</button></div><div id="ltOut"></div>';
      var run = function () {
        var r = data.draws[+g('ltDraw').value], list = (g('ltNum').value.match(/\d+/g) || []), out = '', win = false;
        if (!list.length) { g('ltOut').innerHTML = '<p class="ltE">กรุณากรอกเลขสลาก</p>'; return; }
        list.forEach(function (n) {
          if (n.length !== 6) { out += '<div class="ltRes lose"><b>' + n + '</b><em>ต้องเป็นเลข 6 หลัก</em></div>'; return; }
          var hit = PRIZE.filter(function (p) {
            var v = p[3] === 6 ? n : p[3] > 0 ? n.slice(0, p[3]) : n.slice(p[3]);
            return [].concat(r[p[0]]).indexOf(v) >= 0;
          });
          var sum = hit.reduce(function (a, p) { return a + p[2]; }, 0);
          if (hit.length) win = true;
          out += '<div class="ltRes ' + (hit.length ? 'win' : 'lose') + '"><b>' + n + '</b>' + (hit.length
            ? hit.map(function (p) { return '<em>🎉 ถูก' + p[1] + ' ' + p[2].toLocaleString() + ' บาท</em>'; }).join('') + (hit.length > 1 ? '<em>รวม ' + sum.toLocaleString() + ' บาท</em>' : '')
            : '<em>ไม่ถูกรางวัล งวดหน้าลุ้นใหม่นะ</em>') + '</div>';
        });
        g('ltOut').innerHTML = out;
        if (win) confetti();
      };
      g('ltGo').onclick = run;
      g('ltNum').onkeydown = function (e) { if (e.key === 'Enter') run(); };
    }

    function viewHistory() {
      C.innerHTML = data.draws.map(function (r, i) {
        return '<button class="ltH" data-i="' + i + '"><small>งวด ' + thDate(r.date) + '</small><b>' + r.first + '</b>' +
          '<span>หน้า 3 ตัว ' + r.front3.join(', ') + ' · ท้าย 3 ตัว ' + r.last3.join(', ') + ' · ท้าย 2 ตัว <strong>' + r.last2 + '</strong></span></button>';
      }).join('');
      [].forEach.call(C.querySelectorAll('.ltH'), function (b) { b.onclick = function () { cur = +b.getAttribute('data-i'); setTab('r', true); }; });
    }

    function viewSiamsi() {
      var sticks = ''; for (var i = 0; i < 7; i++) sticks += '<i style="left:' + (22 + i * 11) + 'px;transform:rotate(' + (i * 4 - 12) + 'deg)"></i>';
      C.innerHTML = '<div class="ltSs"><p>ตั้งจิตอธิษฐาน แล้วกดเขย่าเซียมซีรับเลขเด็ดงวดนี้</p>' +
        '<div class="ltCup" id="ltCup">' + sticks + '<div class="cup"></div></div>' +
        '<button class="ltGo" id="ltShake" style="margin-top:12px">🙏 เขย่าเซียมซี</button>' +
        '<div class="ltStick' + (ssNums ? ' on' : '') + '" id="ltStick">' + stickHtml() + '</div>' +
        '<p class="ltNote">* เลขสุ่มเพื่อความบันเทิงเท่านั้น</p></div>';
      g('ltShake').onclick = function () {
        var cup = g('ltCup'), stick = g('ltStick'), btn = this;
        btn.disabled = true; stick.className = 'ltStick';
        cup.classList.remove('shake'); void cup.offsetWidth; cup.classList.add('shake');
        setTimeout(function () {
          var r = function (n) { var s = ''; for (var k = 0; k < n; k++) s += Math.floor(Math.random() * 10); return s; };
          ssNums = [r(2), r(3)];
          stick.innerHTML = stickHtml(); stick.className = 'ltStick on'; btn.disabled = false;
        }, 1300);
      };
    }
    function stickHtml() { return ssNums ? '<small>เลขเด็ด 2 ตัว</small><b>' + ssNums[0] + '</b><small>3 ตัว</small><b>' + ssNums[1] + '</b>' : ''; }

    function render(roll) {
      if (tab === 's') return viewSiamsi();
      if (!data) { C.innerHTML = '<p class="ltE">กำลังโหลดผลรางวัล...</p>'; return; }
      ({ r: viewResult, c: viewCheck, h: viewHistory })[tab](roll);
    }
    function setTab(t, roll) {
      tab = t;
      [].forEach.call(d.querySelectorAll('#ltH nav button'), function (b) { b.className = b.getAttribute('data-t') === t ? 'on' : ''; });
      render(roll);
    }

    function confetti() {
      var col = ['#ffd36b', '#d4001f', '#fff', '#e0a800', '#ff5a3c'];
      for (var i = 0; i < 40; i++) {
        var c = d.createElement('div'); c.className = 'ltConf';
        c.style.left = Math.random() * 100 + 'vw'; c.style.background = col[i % col.length];
        c.style.animationDuration = 1.5 + Math.random() * 1.5 + 's'; c.style.animationDelay = Math.random() * .4 + 's';
        d.body.appendChild(c); setTimeout(function (x) { return function () { x.remove(); }; }(c), 3500);
      }
    }

    function open(t) {
      O.className = 'on'; B.classList.remove('ltDot');
      if (t) tab = t;
      cur = 0; setTab(tab, true); countdown();
      clearInterval(tick); tick = setInterval(countdown, 1000);
      clearInterval(timer);
      // วันหวยออก: เช็คผลใหม่ทุก 1 นาที
      timer = setInterval(function () {
        if (!isDrawDay() || hasToday()) return;
        load().then(function (changed) { if (changed) { cur = 0; if (tab === 'r') render(true); confetti(); } countdown(); }).catch(function () {});
      }, 6e4);
    }
    function close() { O.className = ''; clearInterval(tick); clearInterval(timer); }

    // ===== ปุ่มข้างจอ: ลากย้าย / ซ่อน =====
    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }
    try { localStorage.removeItem('ltHide'); localStorage.removeItem('ltMini'); } catch (e) {} // ล้างค่าซ่อน/ย่อ ของเวอร์ชันเก่า
    var hidden = false; // กด ✕ = ซ่อนเฉพาะหน้านี้ รีเฟรชแล้วปุ่มกลับมา
    try { var pos = JSON.parse(ls('ltPos') || 'null'); if (pos) { W.classList.toggle('r', !!pos.r); W.style.top = pos.t + '%'; } } catch (e) {}

    var drag = null, justDragged = false;
    B.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, moved: false };
      try { B.setPointerCapture(e.pointerId); } catch (x) {}
    });
    B.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.moved = true; W.classList.add('drag');
      W.style.top = Math.min(Math.max(e.clientY, 60), innerHeight - 60) + 'px';
      W.classList.toggle('r', e.clientX > innerWidth / 2);
    });
    function endDrag() {
      if (drag && drag.moved) {
        var t = parseFloat(W.style.top) / innerHeight * 100;
        W.style.top = t.toFixed(1) + '%';
        ls('ltPos', JSON.stringify({ r: W.classList.contains('r'), t: +t.toFixed(1) }));
        justDragged = true;
      }
      drag = null; W.classList.remove('drag');
    }
    B.addEventListener('pointerup', endDrag);
    B.addEventListener('pointercancel', endDrag);
    B.onclick = function () {
      if (justDragged) { justDragged = false; return; }
      open();
    };
    g('ltHd').onclick = function () { hidden = true; W.style.display = 'none'; };

    // ===== ลากย้ายป๊อปอัปด้วยแถบหัว =====
    var pd = null;
    g('ltH').addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      var r = P.getBoundingClientRect(), cs = getComputedStyle(P);
      pd = { x: e.clientX, y: e.clientY, dx: parseFloat(cs.getPropertyValue('--dx')) || 0, dy: parseFloat(cs.getPropertyValue('--dy')) || 0, r: r };
      P.classList.add('drag');
      try { this.setPointerCapture(e.pointerId); } catch (x) {}
    });
    g('ltH').addEventListener('pointermove', function (e) {
      if (!pd) return;
      var mx = e.clientX - pd.x, my = e.clientY - pd.y, r = pd.r;
      mx = Math.min(Math.max(mx, -r.left), innerWidth - r.right);   // ไม่ให้หลุดขอบจอ
      my = Math.min(Math.max(my, -r.top), innerHeight - r.top - 60);
      P.style.setProperty('--dx', pd.dx + mx + 'px');
      P.style.setProperty('--dy', pd.dy + my + 'px');
    });
    function endPanel() { pd = null; P.classList.remove('drag'); }
    g('ltH').addEventListener('pointerup', endPanel);
    g('ltH').addEventListener('pointercancel', endPanel);

    g('ltX').onclick = close;
    O.onclick = function (e) { if (e.target === O) close(); };
    [].forEach.call(d.querySelectorAll('#ltH nav button'), function (b) { b.onclick = function () { cur = 0; setTab(b.getAttribute('data-t'), true); }; });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && O.className) close(); });

    load().then(function () {
      if (O.className) render(true);
      // วันหวยออก: จุดกะพริบที่ปุ่ม + เด้งเอง 1 ครั้งต่อการเปิดเว็บ
      if (isDrawDay() || hasToday()) {
        B.classList.add('ltDot');
        var seen = false; try { seen = sessionStorage.getItem('ltAuto') === bkkDay(now()); } catch (e) {}
        if (CFG.autoOpen && !hidden && !seen && !O.className) {
          setTimeout(function () { open('r'); if (hasToday()) confetti(); }, 1200);
          try { sessionStorage.setItem('ltAuto', bkkDay(now())); } catch (e) {}
        }
      }
    }).catch(function () { if (O.className) C.innerHTML = '<p class="ltE">โหลดผลรางวัลไม่ได้ ลองใหม่อีกครั้ง</p>'; });
  }

  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
