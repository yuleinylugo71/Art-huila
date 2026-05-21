document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('pago_exitoso') === 'true' || params.has('ref_payco') || params.has('x_ref_payco')) {
    Cart.clear();
    window.location.href = '/views/pago-exitoso.html' + window.location.search;
    return;
  }

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
  document.getElementById('summary-total').textContent = '$' + (total + (window.currentShippingCost || 0)).toLocaleString('es-CO');
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
  // API is defined globally in api.js as 'http://localhost:3000/api/v1'
  // We want the base server URL for images (http://localhost:3000)
  const baseUrl = API.replace('/api/v1', '');
  return baseUrl + (url.startsWith('/') ? '' : '/') + url;
}

window.calculateShipping = async function() {
  const citySelect = document.getElementById('destination-city');
  const city = citySelect.value;
  if (!city) {
    showToast('Por favor selecciona una ciudad destino', 'warning');
    return;
  }

  const cart = Cart.get();
  if (cart.length === 0) return;

  const btn = document.getElementById('btn-quote-shipping');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Calculando...';

  try {
    const payload = {
      destinationCity: city,
      items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
    };

    const quote = await apiFetch('/orders/shipping-quote', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    window.currentShippingCost = quote.cost;
    window.currentDestinationCity = city;

    const resultDiv = document.getElementById('shipping-result');
    resultDiv.style.display = 'block';
    
    let html = `<div style="color: var(--color-text);"><strong>Transportadora:</strong> ${quote.carrier}</div>
                <div style="color: var(--color-text);"><strong>Tiempo estimado:</strong> ${quote.estimatedDays} días hábiles</div>`;
    
    if (quote.fallbackMessage) {
      html += `<div style="color: var(--color-warning); margin-top: 0.5rem; font-size: 0.8rem;"><em>Nota: ${quote.fallbackMessage}</em></div>`;
    } else {
      html += `<div style="color: var(--color-success); margin-top: 0.5rem; font-size: 0.8rem;"><em>El envío se calcula desde ${quote.originCity}</em></div>`;
    }

    resultDiv.innerHTML = html;
    
    document.getElementById('summary-shipping').textContent = '$' + quote.cost.toLocaleString('es-CO');
    renderCart();

  } catch (error) {
    console.error('Error calculating shipping', error);
    showToast('Error al calcular el envío', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

async function proceedToCheckout() {
  const token = Auth.getToken();
  if (!token) {
    showToast('Debes iniciar sesión para realizar la compra.', 'warning');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }

  const cart = Cart.get();
  if (cart.length === 0) return;

  if (!window.currentDestinationCity) {
    showToast('Por favor calcula el costo de envío primero', 'warning');
    return;
  }

  const btn = document.getElementById('btn-checkout');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Generando orden...';

  const payload = {
    items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
    shipping_address: { city: window.currentDestinationCity, address: 'Dirección de ejemplo' },
    payment_method: 'EPAYCO'
  };

  try {
    const order = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    console.log('Order created:', order);
    btn.textContent = 'Abriendo pasarela...';
    
    // Obtener configuración de ePayco
    const config = await apiFetch('/payments/epayco-config');
    console.log('ePayco config received:', config);

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handler = ePayco.checkout.configure({
      key: config.publicKey,
      test: true
    });

    const data = {
      name: "Artesanías del Huila",
      description: "Compra de productos artesanales",
      invoice: order.id,
      currency: "cop",
      amount: String(order.total_amount),
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",
      external: "true",
      response: window.location.origin + '/views/carrito.html?pago_exitoso=true',
    };

    handler.open(data);
    
    btn.disabled = false;
    btn.textContent = originalText;


  } catch (e) {
    console.error('Checkout error:', e);
    showToast('No se pudo procesar la orden: ' + (Array.isArray(e.message) ? e.message.join(', ') : e.message), 'error');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
