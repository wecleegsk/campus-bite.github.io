/* Campus Bite Assistant
 * A chat helper + budget finder that runs entirely in the browser.
 * It answers from the menu and info below (rule-based intent matching, no server, no API key).
 * To change a price, hour or contact detail, edit the DATA section only.
 */
(function () {
  'use strict';

  /* ===================== DATA (edit here) ===================== */
  var WA_FOOD = '27790155149';      // kota / drinks WhatsApp
  var WA_SUPPORT = '27647383756';   // delivery / tutoring / calculators WhatsApp
  var EMAIL = 'campusBite@gmail.com';
  var PHONE_DISPLAY = '+27 64 738 3756';

  var ITEMS = [
    { name: 'Kota King', price: 35, type: 'food', aliases: ['kota king', 'king'] },
    { name: 'Medium Size Kota', price: 25, type: 'food', aliases: ['medium kota', 'medium size'] },
    { name: 'Fries (Big Size)', price: 30, type: 'food', aliases: ['big fries', 'big size'] },
    { name: 'Medium Fries + 2 Russians', price: 40, type: 'food', aliases: ['russian', 'medium fries'] },
    { name: 'Lemon Twist', price: 22, type: 'drink', aliases: ['lemon'] },
    { name: 'Sprite', price: 25, type: 'drink', aliases: ['sprite'] },
    { name: '300ml Coke', price: 14, type: 'drink', aliases: ['300ml', '300 ml'] },
    { name: '750ml Coke', price: 18, type: 'drink', aliases: ['750ml', '750 ml'] }
  ];
  // a general word (e.g. "coke") matches every item in its group
  var GENERIC_ALIASES = {
    kota: ['Kota King', 'Medium Size Kota'],
    fries: ['Fries (Big Size)', 'Medium Fries + 2 Russians'],
    coke: ['300ml Coke', '750ml Coke']
  };

  var HOURS = { openMin: 8 * 60, closeMin: 17 * 60, days: [1, 2, 3, 4, 5] }; // Mon-Fri 08:00-17:00
  var CALCULATOR = { name: 'FX-991ES Matrix', price: 300, editions: 'Matte Black or Pristine White' };
  var TUTORING = { subjects: ['Mathematics', 'Computer Networks'], oneOnOne: 250, group: 100 };
  /* =================== END DATA ================================ */

  function fmt(n) { return 'R' + n.toFixed(2); }
  function byType(t) { return ITEMS.filter(function (i) { return i.type === t; }); }
  function waLink(number, text) {
    return 'https://wa.me/' + number + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function lines(items) {
    return items.map(function (i) { return '\u2022 ' + i.name + ' \u2013 ' + fmt(i.price); }).join('\n');
  }

  /* ---------- opening hours ---------- */
  function saNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-ZA', {
        timeZone: 'Africa/Johannesburg', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: map[o.weekday], mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function isOpenNow() {
    var n = saNow();
    return HOURS.days.indexOf(n.day) !== -1 && n.mins >= HOURS.openMin && n.mins < HOURS.closeMin;
  }

  /* ---------- budget finder ---------- */
  function budgetOptions(budget) {
    var food = byType('food'), drinks = byType('drink'), all = [];
    food.forEach(function (f) {
      if (f.price <= budget) all.push({ items: [f], total: f.price });
      drinks.forEach(function (d) {
        if (f.price + d.price <= budget) all.push({ items: [f, d], total: f.price + d.price });
      });
    });
    return all;
  }

  function budgetResult(budget) {
    var cheapestDrink = Math.min.apply(null, byType('drink').map(function (i) { return i.price; }));
    var cheapestFood = Math.min.apply(null, byType('food').map(function (i) { return i.price; }));
    var rows = [];
    if (!(budget > 0)) {
      return { headline: 'Enter an amount in rand, for example 50.', rows: rows };
    }
    if (budget < cheapestDrink) {
      return { headline: fmt(budget) + ' is below our cheapest item (' + fmt(cheapestDrink) + ').', rows: rows };
    }
    if (budget < cheapestFood) {
      byType('drink').filter(function (d) { return d.price <= budget; }).forEach(function (d) {
        rows.push(makeRow([d], budget));
      });
      return {
        headline: fmt(budget) + ' covers a drink, but food starts at ' + fmt(cheapestFood) + '.',
        rows: rows
      };
    }
    var opts = budgetOptions(budget);
    var withDrink = opts.filter(function (o) { return o.items.length === 2; });
    var pool = withDrink.length ? withDrink : opts;

    var cheapest = pool.slice().sort(function (a, b) { return a.total - b.total; })[0];
    var fullest = pool.slice().sort(function (a, b) { return b.total - a.total; })[0];

    var picked = [];
    function add(o, tag) {
      var key = o.items.map(function (i) { return i.name; }).join('|');
      if (picked.indexOf(key) === -1) { picked.push(key); rows.push(makeRow(o.items, budget, tag)); }
    }
    add(fullest, 'Best use of your money');
    add(cheapest, 'Cheapest meal');
    pool.slice().sort(function (a, b) { return b.total - a.total; }).forEach(function (o) {
      if (rows.length < 5) add(o);
    });
    return { headline: 'With ' + fmt(budget) + ' you can get:', rows: rows };
  }

  function makeRow(items, budget, tag) {
    var total = items.reduce(function (s, i) { return s + i.price; }, 0);
    var names = items.map(function (i) { return i.name; }).join(' + ');
    return {
      tag: tag || '',
      label: names,
      total: total,
      left: budget - total,
      href: waLink(WA_FOOD, "Hi Campus Bite! I'd like to order: " + names + ' (' + fmt(total) + ')')
    };
  }

  /* ---------- chat brain ---------- */
  var CHIPS = ['Menu', 'Drinks', 'Opening hours', 'Delivery', 'Tutoring', 'Budget finder'];

  function parseBudget(raw) {
    var m = raw.match(/\bR\s?(\d+(?:[.,]\d+)?)/i) ||
            raw.match(/(\d+(?:[.,]\d+)?)\s*(?:rand|bucks|zar)\b/i);
    if (!m && /\b(budget|have|only|afford|under|spend|got)\b/i.test(raw)) {
      m = raw.match(/(\d+(?:[.,]\d+)?)(?!\s*ml)/i);
    }
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }

  function matchItems(t) {
    var found = ITEMS.filter(function (it) {
      return it.aliases.some(function (a) { return t.indexOf(a) !== -1; });
    });
    if (!found.length) {
      Object.keys(GENERIC_ALIASES).forEach(function (word) {
        if (new RegExp('\\b' + word + '\\b').test(t)) {
          found = found.concat(ITEMS.filter(function (i) { return GENERIC_ALIASES[word].indexOf(i.name) !== -1; }));
        }
      });
    }
    return found;
  }

  function answer(raw) {
    var text = String(raw || '').trim();
    var t = ' ' + text.toLowerCase().replace(/[^a-z0-9+.,\s]/g, ' ') + ' ';
    var has = function (re) { return re.test(t); };

    // 1. budget
    var b = parseBudget(text);
    if (b !== null) return { budget: b };
    if (has(/\b(budget|cheapest|cheap|afford|broke|affordable)\b/)) {
      return { text: "Tell me how much you have and I'll find the best meals, for example: \"I have R50\". You can also use the Budget tab.", chips: ['I have R40', 'I have R60', 'I have R80'] };
    }

    // 2. opening hours
    if (has(/\b(open|opening|close|closing|closed|hours|time|times|weekend|saturday|sunday|today)\b/)) {
      return {
        text: (isOpenNow() ? "We're open right now." : "We're closed right now.") +
              '\nMonday \u2013 Friday: 08:00 \u2013 17:00\nSaturday \u2013 Sunday: Closed'
      };
    }

    // 3. delivery / collection
    if (has(/\b(deliver|delivery|delivered|collect|collection|pickup|pick up|residence)\b/)) {
      return {
        text: 'We deliver meals to your residence or lecture hall, or you can collect. Message us on WhatsApp and say which you prefer. The site does not list a delivery fee, so ask when you order.',
        links: [{ label: 'Order on WhatsApp', href: waLink(WA_SUPPORT, 'Hi Campus Bite! I would like a delivery.') }]
      };
    }

    // 4. calculators
    if (has(/\b(calculator|calculators|fx|casio)\b/)) {
      return {
        text: CALCULATOR.name + ' \u2013 ' + fmt(CALCULATOR.price) + '. Available in ' + CALCULATOR.editions + '.',
        links: [{ label: 'Buy on WhatsApp', href: waLink(WA_SUPPORT, 'Hi Campus Bite! I would like to buy the ' + CALCULATOR.name + '.') }]
      };
    }

    // 5. tutoring
    if (has(/\b(tutor|tutors|tutoring|tutorial|maths|math|mathematics|study|session|sessions|network|networks|class|classes)\b/)) {
      return {
        text: 'Tutoring subjects: ' + TUTORING.subjects.join(' and ') + '.\n\u2022 One-on-one \u2013 ' + fmt(TUTORING.oneOnOne) +
              '\n\u2022 Group classes \u2013 ' + fmt(TUTORING.group),
        links: [{ label: 'Book a session', href: waLink(WA_SUPPORT, 'Hi Campus Bite! I would like to book a tutoring session.') }]
      };
    }

    // 6. a specific item
    var items = matchItems(t);
    if (items.length) {
      var link = waLink(WA_FOOD, "Hi Campus Bite! I'd like to order: " + items[0].name + ' (' + fmt(items[0].price) + ')');
      return { text: lines(items), links: [{ label: 'Order ' + items[0].name, href: link }] };
    }

    // 7. menus
    if (has(/\b(drink|drinks|thirsty|beverage|beverages|cold)\b/)) {
      return { text: 'Drinks:\n' + lines(byType('drink')) };
    }
    if (has(/\b(menu|food|eat|hungry|meal|meals|kota|sell|offer|price|prices|cost|much)\b/)) {
      return {
        text: 'Food:\n' + lines(byType('food')) + '\n\nDrinks:\n' + lines(byType('drink')),
        chips: ['Budget finder']
      };
    }

    // 8. ordering / payment
    if (has(/\b(order|cart|checkout|buy|pay|payment)\b/)) {
      return {
        text: 'On the Kota page, tap "Add to cart", open the cart and press the WhatsApp checkout button. On the Drinks page, tap "Order Now". The site does not take online payments, so you confirm and pay with the vendor over WhatsApp.'
      };
    }

    // 9. contact
    if (has(/\b(contact|phone|call|email|mail|whatsapp|number|support|help)\b/)) {
      return {
        text: 'Email: ' + EMAIL + '\nPhone: ' + PHONE_DISPLAY,
        links: [{ label: 'Chat on WhatsApp', href: waLink(WA_SUPPORT) }]
      };
    }

    // 10. about
    if (has(/\b(about|who|what is|campus bite|tut|services)\b/)) {
      return {
        text: 'Campus Bite is a campus convenience platform for TUT students and staff: affordable meals with delivery or collection, calculators, and tutoring in Maths and Computer Networks.'
      };
    }

    // 11. small talk
    if (has(/\b(thanks|thank you|cheers|dankie|ngiyabonga)\b/)) {
      return { text: "You're welcome! Anything else I can help with?" };
    }
    if (has(/\b(bye|goodbye|cya)\b/)) {
      return { text: 'Bye! Enjoy your meal.' };
    }
    if (has(/\b(hi|hello|hey|howzit|sawubona|dumela|molo|morning|afternoon|evening)\b/)) {
      return { text: 'Hi! I can help with the menu, prices, opening hours, delivery, tutoring, calculators, or find a meal for your budget.', chips: CHIPS };
    }

    return {
      text: "I'm not sure about that one. I can help with the menu, prices, opening hours, delivery, tutoring, calculators, and finding a meal for your budget.",
      chips: CHIPS
    };
  }

  /* expose pure logic for testing */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { answer: answer, budgetResult: budgetResult, budgetOptions: budgetOptions, isOpenNow: isOpenNow };
  }
  if (typeof document === 'undefined') return;

  /* ===================== UI ===================== */
  var CSS = [
    '.cb-fab{position:fixed;right:16px;bottom:16px;z-index:9998;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;background:#ffb703;color:#090b0e;font-size:26px;box-shadow:0 6px 20px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}',
    '.cb-fab:hover{background:#fb8500}',
    '.cb-panel{position:fixed;right:16px;bottom:86px;z-index:9999;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));background:#13171c;color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px}',
    '.cb-panel.cb-open{display:flex}',
    '.cb-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#090b0e;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.cb-head strong{display:block;font-size:15px}',
    '.cb-head small{color:#94a3b8}',
    '.cb-x{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}',
    '.cb-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.cb-tab{flex:1;padding:10px;background:none;border:none;color:#94a3b8;font:inherit;font-weight:600;cursor:pointer;border-bottom:2px solid transparent}',
    '.cb-tab.cb-on{color:#ffb703;border-bottom-color:#ffb703}',
    '.cb-view{flex:1;display:none;flex-direction:column;min-height:0}',
    '.cb-view.cb-on{display:flex}',
    '.cb-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}',
    '.cb-msg{max-width:88%;padding:9px 12px;border-radius:14px;white-space:pre-line;line-height:1.45;word-wrap:break-word}',
    '.cb-bot{background:#1e242c;align-self:flex-start;border-bottom-left-radius:4px}',
    '.cb-user{background:#ffb703;color:#090b0e;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}',
    '.cb-link{display:inline-block;margin-top:8px;margin-right:6px;padding:6px 12px;border-radius:999px;background:#25D366;color:#fff!important;text-decoration:none;font-weight:700;font-size:13px}',
    '.cb-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}',
    '.cb-chip{padding:6px 11px;border-radius:999px;border:1px solid rgba(255,183,3,.5);background:none;color:#ffb703;font:inherit;font-size:12.5px;cursor:pointer}',
    '.cb-chip:hover{background:rgba(255,183,3,.12)}',
    '.cb-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(255,255,255,.08)}',
    '.cb-in{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#090b0e;color:#fff;font:inherit}',
    '.cb-in:focus{outline:2px solid #ffb703;outline-offset:0}',
    '.cb-send{padding:0 16px;border:none;border-radius:10px;background:#ffb703;color:#090b0e;font:inherit;font-weight:700;cursor:pointer}',
    '.cb-budget{padding:14px;overflow-y:auto;flex:1}',
    '.cb-budget p{margin:0 0 10px;color:#94a3b8}',
    '.cb-row{background:#1e242c;border-radius:12px;padding:10px 12px;margin-top:10px}',
    '.cb-tag{display:inline-block;font-size:11px;font-weight:700;color:#090b0e;background:#ffb703;border-radius:999px;padding:2px 8px;margin-bottom:4px}',
    '.cb-row b{display:block}',
    '.cb-row span{color:#94a3b8;font-size:12.5px}',
    '.cb-note{margin-top:12px;font-size:12px;color:#64748b}'
  ].join('');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function linkEl(l) {
    var a = el('a', 'cb-link', l.label);
    a.href = l.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }

  function init() {
    var style = el('style'); style.textContent = CSS; document.head.appendChild(style);

    var fab = el('button', 'cb-fab', '\uD83D\uDCAC');
    fab.type = 'button'; fab.setAttribute('aria-label', 'Open Campus Bite assistant'); fab.setAttribute('aria-expanded', 'false');

    var panel = el('div', 'cb-panel');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Campus Bite assistant');

    var head = el('div', 'cb-head');
    var title = el('div');
    title.appendChild(el('strong', '', 'Campus Bite Assistant'));
    title.appendChild(el('small', '', 'Menu, prices, hours & budget'));
    var close = el('button', 'cb-x', '\u00D7'); close.type = 'button'; close.setAttribute('aria-label', 'Close assistant');
    head.appendChild(title); head.appendChild(close);

    var tabs = el('div', 'cb-tabs');
    var tabChat = el('button', 'cb-tab cb-on', 'Chat'); tabChat.type = 'button';
    var tabBudget = el('button', 'cb-tab', 'Budget finder'); tabBudget.type = 'button';
    tabs.appendChild(tabChat); tabs.appendChild(tabBudget);

    // chat view
    var chatView = el('div', 'cb-view cb-on');
    var msgs = el('div', 'cb-msgs'); msgs.setAttribute('aria-live', 'polite');
    var chips = el('div', 'cb-chips');
    var form = el('form', 'cb-form');
    var input = el('input', 'cb-in'); input.type = 'text'; input.placeholder = 'Ask about food, prices, hours\u2026';
    input.setAttribute('aria-label', 'Type your question'); input.autocomplete = 'off';
    var send = el('button', 'cb-send', 'Send'); send.type = 'submit';
    form.appendChild(input); form.appendChild(send);
    chatView.appendChild(msgs); chatView.appendChild(chips); chatView.appendChild(form);

    // budget view
    var budView = el('div', 'cb-view');
    var bud = el('div', 'cb-budget');
    bud.appendChild(el('p', '', 'How much do you have to spend? I\u2019ll show the best meals (food + drink) you can afford.'));
    var bform = el('form', 'cb-form'); bform.style.padding = '0'; bform.style.border = 'none';
    var bin = el('input', 'cb-in'); bin.type = 'number'; bin.min = '1'; bin.step = '1'; bin.inputMode = 'numeric';
    bin.placeholder = 'Amount in rand, e.g. 50'; bin.setAttribute('aria-label', 'Budget in rand');
    var bgo = el('button', 'cb-send', 'Find'); bgo.type = 'submit';
    bform.appendChild(bin); bform.appendChild(bgo);
    var bout = el('div');
    bud.appendChild(bform); bud.appendChild(bout);
    bud.appendChild(el('div', 'cb-note', 'Prices come from the current menu. Confirm and pay with the vendor on WhatsApp.'));
    budView.appendChild(bud);

    panel.appendChild(head); panel.appendChild(tabs); panel.appendChild(chatView); panel.appendChild(budView);
    document.body.appendChild(panel); document.body.appendChild(fab);

    function renderBudget(container, budget) {
      container.textContent = '';
      var r = budgetResult(budget);
      container.appendChild(el('p', '', r.headline));
      container.lastChild.style.marginTop = '12px';
      r.rows.forEach(function (row) {
        var card = el('div', 'cb-row');
        if (row.tag) card.appendChild(el('div', 'cb-tag', row.tag));
        card.appendChild(el('b', '', row.label));
        card.appendChild(el('span', '', fmt(row.total) + ' \u2022 ' + fmt(row.left) + ' left'));
        var a = linkEl({ label: 'Order on WhatsApp', href: row.href });
        card.appendChild(document.createElement('br')); card.appendChild(a);
        container.appendChild(card);
      });
    }

    function scroll() { msgs.scrollTop = msgs.scrollHeight; }
    function userSays(s) { msgs.appendChild(el('div', 'cb-msg cb-user', s)); scroll(); }
    function botSays(resp) {
      var m = el('div', 'cb-msg cb-bot');
      if (resp.budget !== undefined) {
        var wrap = el('div'); renderBudget(wrap, resp.budget); m.style.whiteSpace = 'normal'; m.appendChild(wrap);
      } else {
        m.appendChild(document.createTextNode(resp.text));
        (resp.links || []).forEach(function (l) { m.appendChild(document.createElement('br')); m.appendChild(linkEl(l)); });
      }
      msgs.appendChild(m); scroll();
      setChips(resp.chips || []);
    }
    function setChips(list) {
      chips.textContent = '';
      list.forEach(function (c) {
        var b = el('button', 'cb-chip', c); b.type = 'button';
        b.addEventListener('click', function () { ask(c); });
        chips.appendChild(b);
      });
    }
    function ask(q) {
      if (/^budget finder$/i.test(q)) { showTab('budget'); return; }
      userSays(q); botSays(answer(q));
    }
    function showTab(which) {
      var chat = which === 'chat';
      tabChat.classList.toggle('cb-on', chat); tabBudget.classList.toggle('cb-on', !chat);
      chatView.classList.toggle('cb-on', chat); budView.classList.toggle('cb-on', !chat);
      (chat ? input : bin).focus();
    }

    var greeted = false;
    function open() {
      panel.classList.add('cb-open'); fab.setAttribute('aria-expanded', 'true');
      if (!greeted) {
        greeted = true;
        botSays({ text: 'Hi! I\u2019m the Campus Bite assistant. Ask me about the menu, prices, opening hours, delivery or tutoring, or try the Budget finder.', chips: CHIPS });
      }
      input.focus();
    }
    function shut() { panel.classList.remove('cb-open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

    fab.addEventListener('click', function () { panel.classList.contains('cb-open') ? shut() : open(); });
    close.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('cb-open')) shut(); });
    tabChat.addEventListener('click', function () { showTab('chat'); });
    tabBudget.addEventListener('click', function () { showTab('budget'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return;
      input.value = ''; ask(q);
    });
    bform.addEventListener('submit', function (e) {
      e.preventDefault();
      renderBudget(bout, parseFloat(bin.value));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
