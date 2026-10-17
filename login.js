/* Campus Bite Login
 * Sign Up / Login popup that runs in the browser (no server).
 * Accounts are saved in the visitor's own browser, so this is a demo-level login.
 * To change where the buttons go, edit the DATA section only.
 */
(function () {
  'use strict';

  /* ===================== DATA (edit here) ===================== */
  var LINKS = { menu: 'drinks.html', order: 'fooddel.html' };
  var USERS_KEY = 'cb_users';
  var SESSION_KEY = 'cb_session';
  /* =================== END DATA ================================ */

  function load() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); return true; } catch (e) { return false; }
  }
  function getSession() {
    try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; }
  }
  function setSession(key) {
    try { if (key) localStorage.setItem(SESSION_KEY, key); else localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function hash(s) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
    }
    return Promise.resolve('plain:' + s);
  }
  function displayName() {
    var key = getSession();
    var u = load()[key];
    return u ? u.name : '';
  }

  var CSS = [
    '.cl-btn{position:fixed;top:12px;right:12px;z-index:99998;padding:8px 16px;border:none;border-radius:999px;background:#ffb703;color:#090b0e;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
    '.cl-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:16px;font:15px system-ui,sans-serif}',
    '.cl-overlay.cl-open{display:flex}',
    '.cl-card{width:100%;max-width:360px;background:#12161c;color:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.5)}',
    '.cl-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#1e242c}',
    '.cl-x{background:none;border:none;color:#fff;font-size:24px;line-height:1;cursor:pointer}',
    '.cl-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.cl-tab{flex:1;padding:10px;background:none;border:none;border-bottom:2px solid transparent;color:#94a3b8;font:inherit;font-weight:600;cursor:pointer}',
    '.cl-tab.cl-on{color:#ffb703;border-bottom-color:#ffb703}',
    '.cl-body{padding:16px;display:flex;flex-direction:column;gap:10px}',
    '.cl-in{padding:11px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#090b0e;color:#fff;font:inherit}',
    '.cl-in:focus{outline:2px solid #ffb703}',
    '.cl-go{padding:11px;border:none;border-radius:10px;background:#ffb703;color:#090b0e;font:inherit;font-weight:700;cursor:pointer;text-align:center;text-decoration:none}',
    '.cl-alt{background:#1e242c;color:#fff!important}',
    '.cl-msg{min-height:18px;font-size:13px;color:#f87171}',
    '.cl-ok{color:#4ade80}',
    '.cl-hi{margin:0;color:#94a3b8}'
  ].join('');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function init() {
    var style = el('style'); style.textContent = CSS; document.head.appendChild(style);

    var btn = el('button', 'cl-btn'); btn.type = 'button';
    var overlay = el('div', 'cl-overlay');
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Campus Bite login');
    var card = el('div', 'cl-card');
    overlay.appendChild(card);
    document.body.appendChild(btn); document.body.appendChild(overlay);

    function refreshBtn() {
      var n = displayName();
      btn.textContent = n ? 'Hi, ' + n : 'Login';
    }
    function open() { overlay.classList.add('cl-open'); if (getSession() && displayName()) renderHome(); else renderAuth('login'); }
    function shut() { overlay.classList.remove('cl-open'); }

    function header(title) {
      var h = el('div', 'cl-head');
      h.appendChild(el('strong', '', title));
      var x = el('button', 'cl-x', '\u00D7'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
      x.addEventListener('click', shut);
      h.appendChild(x);
      return h;
    }

    function renderAuth(mode) {
      card.textContent = '';
      card.appendChild(header('==== CAMPUS BITE ===='));

      var tabs = el('div', 'cl-tabs');
      var tLogin = el('button', 'cl-tab' + (mode === 'login' ? ' cl-on' : ''), 'Login');
      var tSign = el('button', 'cl-tab' + (mode === 'signup' ? ' cl-on' : ''), 'Sign Up');
      tLogin.type = 'button'; tSign.type = 'button';
      tLogin.addEventListener('click', function () { renderAuth('login'); });
      tSign.addEventListener('click', function () { renderAuth('signup'); });
      tabs.appendChild(tLogin); tabs.appendChild(tSign);
      card.appendChild(tabs);

      var form = el('form', 'cl-body');
      var u = el('input', 'cl-in'); u.type = 'text'; u.placeholder = 'Username'; u.autocomplete = 'username';
      u.setAttribute('aria-label', 'Username');
      var p = el('input', 'cl-in'); p.type = 'password'; p.placeholder = 'Password';
      p.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
      p.setAttribute('aria-label', 'Password');
      var msg = el('div', 'cl-msg'); msg.setAttribute('aria-live', 'polite');
      var go = el('button', 'cl-go', mode === 'login' ? 'Login' : 'Create account'); go.type = 'submit';
      form.appendChild(u); form.appendChild(p); form.appendChild(msg); form.appendChild(go);
      card.appendChild(form);
      u.focus();

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.className = 'cl-msg';
        var name = u.value.trim(), pass = p.value;
        if (!name || !pass) { msg.textContent = 'Enter a username and password.'; return; }
        var key = name.toLowerCase();
        var users = load();

        if (mode === 'login' && !Object.keys(users).length) {
          msg.textContent = 'Please sign up first.'; return;
        }
        hash(key + ':' + pass).then(function (h) {
          if (mode === 'signup') {
            if (users[key]) { msg.textContent = 'That username is already taken.'; return; }
            users[key] = { name: name, hash: h };
            if (!save(users)) { msg.textContent = 'Could not save the account (browser storage is blocked).'; return; }
            setSession(key); refreshBtn(); renderHome('Account created successfully!');
          } else {
            if (!users[key] || users[key].hash !== h) { msg.textContent = 'Invalid username or password.'; return; }
            setSession(key); refreshBtn(); renderHome('Login successful!');
          }
        });
      });
    }

    function renderHome(note) {
      card.textContent = '';
      card.appendChild(header('==== HOME PAGE ===='));
      var body = el('div', 'cl-body');
      if (note) body.appendChild(el('div', 'cl-msg cl-ok', note));
      body.appendChild(el('p', 'cl-hi', 'Welcome, ' + displayName() + '!'));

      var menu = el('a', 'cl-go', 'View Menu'); menu.href = LINKS.menu;
      var order = el('a', 'cl-go', 'Order Food'); order.href = LINKS.order;
      var out = el('button', 'cl-go cl-alt', 'Logout'); out.type = 'button';
      out.addEventListener('click', function () {
        setSession(null); refreshBtn(); renderAuth('login');
        var m = card.querySelector('.cl-msg'); if (m) { m.className = 'cl-msg cl-ok'; m.textContent = 'Logged out successfully!'; }
      });
      body.appendChild(menu); body.appendChild(order); body.appendChild(out);
      card.appendChild(body);
    }

    btn.addEventListener('click', open);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('cl-open')) shut(); });
    refreshBtn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
