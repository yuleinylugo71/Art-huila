document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  document.getElementById('btn-checkout')?.addEventListener('click', proceedToCheckout);
});

function renderCart() {
  const cart = Cart.get();
  const container = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('cart-empty');
  const contentView = document.getElementById('cart-content');

  if (!container || !emptyView || !contentView) return;

  if (cart.length === 0) {
    emptyView.style.display = 'block';
    contentView.style.display = 'none';
    return;
  }

  emptyView.style.display = 'none';
  contentView.style.display = 'grid';
  container.innerHTML = '';

  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const imgUrl = item.image ? normalizeImage(item.image) : '/img/placeholder.jpg';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${imgUrl}" alt="${item.name}" />
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p style="font-size: 0.85rem; color: var(--color-muted);">Artesano: ${item.artisanName || 'N/A'}</p>
        <div class="cart-item-price">$${Number(item.price).toLocaleString('es-CO')}</div>
      </div>
      <div class="cart-actions">
        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
        <span style="width: 20px; text-align: center;">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
      </div>
      <div style="margin-left: 1rem;">
        <button class="btn-remove" onclick="removeFromCart(${index})">Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('summary-subtotal').textContent = '$' + total.toLocaleString('es-CO');
  document.getElementById('summary-total').textContent = '$' + total.toLocaleString('es-CO');
}

window.updateQuantity = function(index, delta) {
  const cart = Cart.get();
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    Cart.save(cart);
    renderCart();
  }
};

window.removeFromCart = function(index) {
  const cart = Cart.get();
  cart.splice(index, 1);
  Cart.save(cart);
  renderCart();
};

function normalizeImage(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_URL + (url.startsWith('/') ? '' : '/') + url;
}

async function proceedToCheckout() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión para realizar la compra.');
    window.location.href = '/login.html';
    return;
  }

  const cart = getCart();
  if (cart.length === 0) return;

  const payload = {
    items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
    shipping_address: { city: 'Neiva', address: 'Calle 123' }, // Mock para el sprint
    payment_method: 'CREDIT_CARD'
  };

  try {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // Simular el pago
    const orderId = res.id;
    await apiFetch(`/orders/${orderId}/pay`, { method: 'POST' });

    alert('¡Compra realizada con éxito!');
    localStorage.removeItem('arthuila_cart');
    window.location.href = '/dashboard-comprador.html'; // Próxima página a crear
  } catch (e) {
    alert('Error al procesar el pago: ' + e.message);
  }
}
