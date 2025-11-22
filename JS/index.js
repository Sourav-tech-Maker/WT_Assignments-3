

var title = document.querySelector('.title');
if (title) {
    title.addEventListener('mouseover', function () {
        title.style.animationPlayState = 'paused';
    });
    title.addEventListener('mouseout', function () {
        title.style.animationPlayState = 'running';
    });
}


// Simple product store: products added from DOM get an internal id.
let PRODUCTS = []; // {id, name, price, img}
let nextId = 1;
let cart = []; // {id, qty}

// Helpers
const toINR = n => '₹' + n.toLocaleString('en-IN');

function parsePrice(str) {
    // remove any non-digit characters and parse number
    // "₹1,29,999" => 129999
    const digits = (str || '').replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}

function findProductById(id) { return PRODUCTS.find(p => p.id === id) }
function findProductByName(name) { return PRODUCTS.find(p => p.name === name) }

// Save / load cart to localStorage
function saveCart() { localStorage.setItem('sorav_cart', JSON.stringify(cart)) }
function loadCart() { const s = localStorage.getItem('sorav_cart'); if (s) cart = JSON.parse(s) }

// Add product to PRODUCTS store (from DOM) if not exists, return id
function ensureProductFromCard(cardEl) {
    const name = cardEl.querySelector('h3') ? cardEl.querySelector('h3').textContent.trim() : 'Unnamed';
    const priceText = cardEl.querySelector('.price') ? cardEl.querySelector('.price').textContent.trim() : '₹0';
    const imgEl = cardEl.querySelector('img');
    const img = imgEl ? imgEl.src : '';
    const price = parsePrice(priceText);

    let existing = findProductByName(name);
    if (existing) return existing.id;
    const id = nextId++;
    PRODUCTS.push({ id, name, price, img });
    return id;
}

// Add to cart by creating product from article element
function addToCartFromCard(cardEl, qty = 1) {
    const id = ensureProductFromCard(cardEl);
    const item = cart.find(it => it.id === id);
    if (item) item.qty += qty;
    else cart.push({ id, qty });
    saveCart();
    renderCart();
    // optional: briefly show payment overlay or small confirmation
    // For now, just update cart UI. If you want immediate payment open, call openPayment()
}

// Remove/change qty
function removeFromCart(id) { cart = cart.filter(c => c.id !== id); saveCart(); renderCart(); }
function changeQty(id, delta) { const it = cart.find(c => c.id === id); if (!it) return; it.qty += delta; if (it.qty < 1) removeFromCart(id); saveCart(); renderCart(); }
function clearCart() { cart = []; saveCart(); renderCart(); }

function cartTotal() {
    let t = 0;
    cart.forEach(c => {
        const p = findProductById(c.id);
        if (p) t += p.price * c.qty;
    });
    return t;
}

// Render cart UI in aside
const cartList = document.getElementById('cartList');
const cartCount = document.getElementById('cartCount');
const subtotalEl = document.getElementById('subtotal');

function renderCart() {
    cartList.innerHTML = '';
    if (cart.length === 0) {
        cartList.innerHTML = '<div class="muted" style="padding:10px">Cart is empty</div>';
    } else {
        cart.forEach(c => {
            const p = findProductById(c.id);
            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = `
            <img src="${p.img}" alt="${p.name}">
            <div class="c-info">
              <div style="font-weight:700">${p.name}</div>
              <div class="muted">${toINR(p.price)} × ${c.qty} = <strong>${toINR(p.price * c.qty)}</strong></div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end">
              <div>
                <button class="btn small" data-plus="${c.id}">+</button>
                <button class="btn small" data-minus="${c.id}" style="margin-left:6px">-</button>
              </div>
              <button class="btn small secondary" data-remove="${c.id}">Remove</button>
            </div>
          `;
            cartList.appendChild(row);
        });
    }

    cartCount.textContent = cart.length + (cart.length === 1 ? ' item' : ' items');
    subtotalEl.textContent = toINR(cartTotal());

    // attach row buttons
    cartList.querySelectorAll('[data-plus]').forEach(b => b.addEventListener('click', e => changeQty(parseInt(e.target.dataset.plus), 1)));
    cartList.querySelectorAll('[data-minus]').forEach(b => b.addEventListener('click', e => changeQty(parseInt(e.target.dataset.minus), -1)));
    cartList.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', e => removeFromCart(parseInt(e.target.dataset.remove))));
}

// Listen to Add to Cart buttons in your product grid
document.addEventListener('DOMContentLoaded', () => {
    loadCart(); // restore saved cart
    // attach to every .add-to-cart button
    document.querySelectorAll('.product-card .add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            addToCartFromCard(card, 1);

            // Show a small feedback — open payment directly (optional)
            // I'll show a small browser native notification style:
            const original = btn.textContent;
            btn.textContent = 'Added ✓';
            setTimeout(() => btn.textContent = original, 900);
        });
    });

    // Cart control buttons
    document.getElementById('clearCartBtn').addEventListener('click', () => { if (confirm('Clear cart?')) clearCart() });
    document.getElementById('viewInvoiceBtn').addEventListener('click', () => {
        if (cart.length === 0) { alert('Cart is empty'); return }
        openInvoice();
    });

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) { alert('Add items to cart before checkout'); return }
        openPayment();
    });

    // Init render
    renderCart();
});

/* ======= Payment & Invoice logic (copied from demo, adapted to use our PRODUCTS/cart) ======= */

const paymentOverlay = document.getElementById('paymentOverlay');
const payTitle = document.getElementById('payTitle');
const payTotal = document.getElementById('payTotal');
const paymentForm = document.getElementById('paymentForm');
const payMsg = document.getElementById('payMsg');

function openPayment() {
    paymentOverlay.classList.add('show'); paymentOverlay.setAttribute('aria-hidden', 'false');
    payTitle.textContent = 'Payment — ' + cart.length + ' item(s)';
    payTotal.textContent = toINR(cartTotal());
    payMsg.style.display = 'none';
}
function closePayment() { paymentOverlay.classList.remove('show'); paymentOverlay.setAttribute('aria-hidden', 'true') }

// Card number formatting
const cardNumber = document.getElementById('cardNumber');
cardNumber.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    let parts = v.match(/.{1,4}/g);
    e.target.value = parts ? parts.join(' ') : v;
});

paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Simple validation
    const name = document.getElementById('cardName').value.trim();
    const num = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cvv = document.getElementById('cvv').value.trim();
    const exp = document.getElementById('expiry').value;
    if (!name || num.length < 12 || cvv.length < 3 || !exp) { alert('Please enter valid (mock) card details'); return }

    // Simulate processing
    payMsg.style.display = 'none';
    const btn = paymentForm.querySelector('button[type=submit]');
    const old = btn.textContent; btn.textContent = 'Processing...'; btn.disabled = true;

    setTimeout(() => {
        btn.disabled = false; btn.textContent = old;
        payMsg.style.display = 'block';

        // Create order & invoice
        const order = createOrder();
        // Show order placed message briefly then open invoice
        setTimeout(() => {
            closePayment();
            openInvoice(order);
            // Clear cart after payment
            clearCart();
        }, 900);

    }, 1200);
});

// Invoice overlay
const invoiceOverlay = document.getElementById('invoiceOverlay');
const invoiceContent = document.getElementById('invoiceContent');

function createOrder() {
    const id = 'ORD' + Date.now().toString().slice(-6);
    const date = new Date();
    const items = cart.map(c => {
        const p = findProductById(c.id);
        return { name: p.name, price: p.price, qty: c.qty, total: p.price * c.qty };
    });
    const subtotal = cartTotal();
    const tax = Math.round(subtotal * 0.18); // 18% GST mock
    const shipping = subtotal > 5000 ? 0 : 99;
    const grand = subtotal + tax + shipping;
    return { id, date, items, subtotal, tax, shipping, grand };
}

function openInvoice(orderData = null) {
    let order = orderData || createOrderPreview();
    invoiceContent.innerHTML = renderInvoiceHTML(order);
    invoiceOverlay.classList.add('show'); invoiceOverlay.setAttribute('aria-hidden', 'false');
}
function closeInvoice() { invoiceOverlay.classList.remove('show'); invoiceOverlay.setAttribute('aria-hidden', 'true') }

function createOrderPreview() {
    const id = 'PREVIEW' + Math.floor(Math.random() * 9000 + 1000);
    const date = new Date();
    const items = cart.map(c => { const p = findProductById(c.id); return { name: p.name, price: p.price, qty: c.qty, total: p.price * c.qty }; });
    const subtotal = cartTotal();
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal > 5000 ? 0 : 99;
    const grand = subtotal + tax + shipping;
    return { id, date, items, subtotal, tax, shipping, grand };
}

function renderInvoiceHTML(order) {
    const d = new Date(order.date);
    const dateStr = d.toLocaleString('en-IN');
    const itemsRows = order.items.map(it => `<tr><td>${it.name}</td><td class="right">${it.qty}</td><td class="right">${toINR(it.price)}</td><td class="right">${toINR(it.total)}</td></tr>`).join('');
    return `
        <div class="inv-header">
          <div>
            <div style="font-weight:800; font-size:18px">SoRav Electronic Store</div>
            <div class="muted">Your address here</div>
          </div>
          <div style="text-align:right">
            <div><strong>Invoice #</strong> ${order.id}</div>
            <div class="muted">${dateStr}</div>
          </div>
        </div>

        <table style="margin-top:12px">
          <thead>
            <tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-top:12px">
          <div style="width:320px">
            <table style="width:100%">
              <tr><td>Subtotal</td><td class="right">${toINR(order.subtotal)}</td></tr>
              <tr><td>GST (18%)</td><td class="right">${toINR(order.tax)}</td></tr>
              <tr><td>Shipping</td><td class="right">${toINR(order.shipping)}</td></tr>
              <tr><td style="font-weight:800; padding-top:8px">Grand Total</td><td class="right" style="font-weight:800; padding-top:8px">${toINR(order.grand)}</td></tr>
            </table>
          </div>
        </div>

        <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center">
          <div class="muted">Payment Method: Card (mock)</div>
          <div style="color:var(--success); font-weight:800">Order placed successfully ✅</div>
        </div>
      `;
}

function printInvoice() { window.print(); }

// Close overlays when clicking outside modal
document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', (e) => { if (e.target === o) { o.classList.remove('show'); o.setAttribute('aria-hidden', 'true') } });
});

