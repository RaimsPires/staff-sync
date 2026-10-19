(function () {
  if (window.parent === window) return;
  var FILES = { onboarding: 'Onboarding', login: 'Login', setup: 'Setup', home: 'Home', notifications: 'Notifications', map: 'Map', checkin: 'Check-in Flow', checkout: 'Check-out Flow', schedule: 'Schedule', leave: 'Leave', leavedetail: 'Leave Detail', newleave: 'New Leave Request', attendance: 'Attendance', attdetail: 'Attendance Detail', profile: 'Profile and Settings', mhome: 'Manager Home', roster: 'Manager Roster', proxy: 'Proxy Check-in Flow', mleave: 'Manager Leave Requests' };
  var me = (location.search.match(/s=(\w+)/) || [])[1];
  var role = function () { return localStorage.getItem('ss_role') === 'manager' ? 'manager' : 'employee'; };
  var HOME = function () { return role() === 'manager' ? 'mhome' : 'home'; };
  var has = function (t) { return document.body.innerText.indexOf(t) > -1; };
  var R = {
    onboarding: [[/Get started|Commencer|Skip|Passer/, 'login']],
    login: [[/^\|?Continue|Continuer/, function () { return has('Choose your company') || has('Choisissez votre entreprise') ? 'setup' : null; }]],
    setup: [[/Go to Home|Accueil/, 'HOME']],
    home: [[/Notifications|🔔/, 'notifications'], [/Check in|Pointer/, 'checkin'], [/Check out|Fin de service/, 'checkout'], [/Map|Carte/, 'map'], [/Request leave/, 'newleave'], [/My schedule/, 'schedule'], [/My leave/, 'leave'], [/Days present|This week/, 'attendance']],
    notifications: [[/Back/, 'HOME'], [/Schedule ›|Schedule$/, 'schedule'], [/Check-out ›/, 'checkout'], [/Attendance detail ›/, 'attdetail'], [/Leave request ›/, 'leavedetail']],
    map: [[/^\|‹|Back/, 'home'], [/^\|?Check in$/, 'checkin']],
    checkin: [[/Confirm check-in|Cancel/, 'HOME']],
    checkout: [[/Confirm check-out|Check out anyway|Done|Cancel/, 'HOME']],
    schedule: [[/Back/, 'HOME']],
    leave: [[/Back/, 'HOME'], [/Request leave/, 'newleave'], [/(Pending|Approved|Rejected|Changes requested|Cancelled).*(day)/, 'leavedetail']],
    leavedetail: [[/^\|?‹|Back/, 'leave']],
    newleave: [[/Back to Leave/, 'leave'], [/^\|‹/, function () { return has('Step 1 of 2') ? 'leave' : null; }]],
    attendance: [[/Report an issue/, 'attdetail']],
    attdetail: [[/^\|‹|Back/, 'attendance']],
    profile: [],
    mhome: [[/Check in an employee/, 'proxy'], [/View roster/, 'roster'], [/Leave requests|Review request/, 'mleave']],
    roster: [[/Proxy check-in/, 'proxy']],
    proxy: [[/Back to roster/, 'roster'], [/^Back\|/, function () { return has('Step 1 of 4') ? 'roster' : null; }]],
    mleave: [[/Back home/, 'mhome']]
  };
  var TABS = /^\|[^\w\s]{0,3}(Home|Manager|Roster|Attendance|Profile)$/;
  var TABT = { Home: 'home', Manager: 'mhome', Roster: 'roster', Attendance: 'attendance', Profile: 'profile' };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('button,[role=button],a');
    if (!el) return;
    var txt = (el.getAttribute('aria-label') || '') + '|' + el.textContent.replace(/\s+/g, ' ').trim();
    if (phones && cfg.next[idx] && cfg.next[idx].test(txt) && idx + 1 < phones.length) { setTimeout(function () { show(idx + 1); }, 120); return; }
    var to = null, tm = txt.match(TABS);
    var rules = R[me] || [];
    for (var i = 0; i < rules.length && !to; i++) {
      if (rules[i][0].test(txt)) { var t = rules[i][1]; to = typeof t === 'function' ? t() : t; }
    }
    if (!to && tm) to = TABT[tm[1]];
    if (to === 'HOME') to = HOME();
    if (to && to !== me) setTimeout(function () { parent.postMessage({ type: 'ss-nav', to: to }, '*'); }, 120);
  }, true);
  var FR = { onboarding: { n: 3, auto: { 0: 1500 }, next: { 1: /Continue|Continuer/ } }, login: { n: 6, next: { 0: /Continue|Continuer/, 1: /Verify|Vérifier/ } }, setup: { n: 5, next: { 0: /./, 1: /./, 2: /./, 3: /./ } } };
  var cfg = FR[me] || { n: 1, next: {} }, idx = 0, phones = null, timer = null;
  function wrapperOf(ph, root) { var n = ph; while (n.parentElement && n.parentElement !== root) n = n.parentElement; return n; }
  function lca(list) { var a = list[0].parentElement; while (a && !list.every(function (p) { return a.contains(p); })) a = a.parentElement; return a; }
  function show(i, keep) {
    idx = i; if (!keep) clearTimeout(timer);
    var root = phones.length > 1 ? lca(phones) : phones[0];
    phones.forEach(function (p, j) {
      var w = phones.length > 1 ? wrapperOf(p, root) : p;
      w.style.display = j === i ? '' : 'none';
      if (j === i && w !== p) [].slice.call(w.children).forEach(function (c) { if (c !== p && !c.contains(p) && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') c.style.display = 'none'; });
    });
    var n = root;
    while (n && n !== document.body) {
      var par = n.parentElement;
      if (!par) break;
      [].slice.call(par.children).forEach(function (c) { if (c !== n && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') c.style.display = 'none'; });
      par.style.padding = '0'; par.style.margin = '0'; par.style.gap = '0'; par.style.minHeight = '0';
      n = par;
    }
    if (root !== phones[i]) { root.style.padding = '0'; root.style.gap = '0'; }
    phones[i].style.height = '800px'; phones[i].style.borderRadius = '0'; phones[i].style.boxShadow = 'none';
    document.body.style.background = 'transparent'; document.body.style.overflow = 'hidden';
    if (!keep && cfg.auto && cfg.auto[i]) timer = setTimeout(function () { show(i + 1); }, cfg.auto[i]);
  }
  function strip() {
    if (phones) { show(idx, true); return; }
    var l = [].slice.call(document.querySelectorAll('div')).filter(function (d) { return d.style.width === '390px' && parseInt(d.style.height) >= 700 && parseInt(d.style.height) <= 800; });
    if (!l.length || (cfg.n > 1 && l.length < cfg.n)) return;
    phones = l.slice(0, cfg.n); show(0);
  }
  new MutationObserver(strip).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(strip, 200);
})();
