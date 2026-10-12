// Load existing cart from localStorage or start fresh
let cart = JSON.parse(localStorage.getItem('campusBiteCart')) || [];

// Update badge count on load
document.addEventListener('DOMContentLoaded', updateCartUI);

function toggleCart() {
    document.getElementById('cartDrawer').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('open');
}

function addToCart(button) {
    const card = button.closest('.menu-card');
    const name = card.getAttribute('data-name');
    const price = parseFloat(card.getAttribute('data-price'));

    // Check if item already exists in cart
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    saveAndRefresh();
    
    // Quick visual feedback on button
    let originalText = button.innerText;
    button.innerText = "Added! ✓";
    button.style.background = "#25D366";
    button.style.color = "white";
    setTimeout(() => {
        button.innerText = originalText;
        button.style.background = "";
        button.style.color = "";
    }, 1000);
}

function changeQuantity(name, amount) {
    let item = cart.find(item => item.name === name);
    if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.name !== name);
        }
    }
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('campusBiteCart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');

    // Calculate total count & price
    let totalItems = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
        cartBody.innerHTML = `<p style="text-align: center; color: #888; margin-top: 40px;">Your cart is empty 🍔</p>`;
    } else {
        cartBody.innerHTML = '';
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;

            cartBody.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <small>R${item.price.toFixed(2)} each</small>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="changeQuantity('${item.name}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity('${item.name}', 1)">+</button>
                    </div>
                </div>
            `;
        });
    }

    cartCount.innerText = totalItems;
    cartTotal.innerText = `R${totalPrice.toFixed(2)}`;
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Your cart is empty! Add some delicious meals first.");
        return;
    }

    let message = "Hi Campus Bite! I'd like to place an order:%0A%0A";
    let total = 0;

    cart.forEach(item => {
        let itemSum = item.price * item.quantity;
        total += itemSum;
        message += `• ${item.quantity}x ${item.name} - R${itemSum.toFixed(2)}%0A`;
    });

    message += `%0A*Total: R${total.toFixed(2)}*%0APlease confirm my order!`;

    // Replace with your actual WhatsApp business/personal number (international format without +)
    let phoneNumber = "27800000000"; 

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}
