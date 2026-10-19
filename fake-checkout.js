// fake-checkout.js — demo checkout, no real payment, nothing is sent anywhere
(function () {
  // ===== CHANGE THESE 3 TO MATCH YOUR SITE =====
  const CART_KEY = 'cart';              // localStorage key where your cart is saved
  const CHECKOUT_BTN = '#checkout-btn'; // selector of your "Checkout" button
  const CURRENCY = 'R';                 // currency symbol
  // Cart format expected: [{ name: 'Burger', price: 45, qty: 2 }, ...]
  // =============================================

  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  };
  const total = (cart) => cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  const style = document.createElement('style');
  style.textContent = `
    .fc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:sans-serif}
    .fc-box{background:#fff;color:#222;width:90%;max-width:380px;border-radius:12px;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
    .fc-box h2{margin:0 0 4px}
    .fc-box input{width:100%;padding:10px;margin:6px 0;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;font-size:15px}
    .fc-row{display:flex;gap:8px}
    .fc-btn{width:100%;padding:12px;margin-top:10px;border:0;border-radius:6px;background:#16a34a;color:#fff;font-size:16px;cursor:pointer}
    .fc-cancel{background:#eee;color:#333}
    .fc-note{font-size:12px;color:#888;margin-top:8px;text-align:center}
    .fc-spin{width:40px;height:40px;border:4px solid #ddd;border-top-color:#16a34a;border-radius:50%;margin:20px auto;animation:fcspin 1s linear infinite}
    @keyframes fcspin{to{transform:rotate(360deg)}}
    .fc-center{text-align:center}
  `;
  document.head.appendChild(style);

  function openModal() {
    const cart = getCart();
    if (!cart.length) { alert('Your cart is empty.'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'fc-overlay';
    const box = document.createElement('div');
    box.className = 'fc-box';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    box.innerHTML = `
      <h2>Payment</h2>
      <p>Total: <b>${CURRENCY}${total(cart).toFixed(2)}</b></p>
      <input id="fc-name" placeholder="Name on card">
      <input id="fc-card" placeholder="4242 4242 4242 4242" maxlength="19" inputmode="numeric">
      <div class="fc-row">
        <input id="fc-exp" placeholder="MM/YY" maxlength="5">
        <input id="fc-cvc" placeholder="CVC" maxlength="3" inputmode="numeric">
      </div>
      <button class="fc-btn" id="fc-pay">Pay ${CURRENCY}${total(cart).toFixed(2)}</button>
      <button class="fc-btn fc-cancel" id="fc-close">Cancel</button>
      <div class="fc-note">Demo mode — no real payment is processed</div>
    `;

    // auto-format card number with spaces
    box.querySelector('#fc-card').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
    // auto-format expiry
    box.querySelector('#fc-exp').addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      e.target.value = v;
    });

    box.querySelector('#fc-close').onclick = () => overlay.remove();

    box.querySelector('#fc-pay').onclick = () => {
      const name = box.querySelector('#fc-name').value.trim();
      const card = box.querySelector('#fc-card').value.replace(/\s/g, '');
      const exp = box.querySelector('#fc-exp').value;
      const cvc = box.querySelector('#fc-cvc').value;

      if (!name || card.length < 16 || exp.length < 5 || cvc.length < 3) {
        alert('Please fill in all card details.');
        return;
      }
      // fake decline to test the error path
      if (card === '4000000000000002') {
        alert('Your card was declined.');
        return;
      }

      // processing...
      box.innerHTML = `<div class="fc-center"><h2>Processing...</h2><div class="fc-spin"></div><p>Please don't close this page</p></div>`;

      setTimeout(() => {
        const orderNo = 'CB-' + Math.floor(100000 + Math.random() * 900000);
        localStorage.removeItem(CART_KEY);
        box.innerHTML = `
          <div class="fc-center">
            <div style="font-size:48px">✅</div>
            <h2>Payment successful!</h2>
            <p>Order number: <b>${orderNo}</b></p>
            <p>Thank you, ${name.split(' ')[0]}!</p>
            <button class="fc-btn" id="fc-done">Done</button>
          </div>`;
        box.querySelector('#fc-done').onclick = () => location.reload();
      }, 2000);
    };
  }

  // works even if the button is added to the page later
  document.addEventListener('click', (e) => {
    if (e.target.closest(CHECKOUT_BTN)) {
      e.preventDefault();
      openModal();
    }
  });
})();
