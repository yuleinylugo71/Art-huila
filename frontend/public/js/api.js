const API = 'http://localhost:3000/api/v1';

const Auth = {
  getToken: () => localStorage.getItem('access_token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (data) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
  requireRole: (role) => {
    const user = Auth.getUser();
    if (!user) { window.location.href = '/login.html'; return false; }
    if (user.role !== role) { window.location.href = '/index.html'; return false; }
    return true;
  }
};

async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const headers = { ...options.headers };
  // Only set application/json if it's not FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error de red' }));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Error');
    throw new Error(msg);
  }
  return res.json();
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

function formatPrice(p) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);
}

const Cart = {
  _getKey: () => {
    const user = Auth.getUser();
    return user ? `arthuila_cart_${user.id}` : 'arthuila_cart_guest';
  },
  get: () => JSON.parse(localStorage.getItem(Cart._getKey()) || '[]'),
  save: (cart) => {
    localStorage.setItem(Cart._getKey(), JSON.stringify(cart));
    Cart.updateNav();
  },
  add: (product, quantity = 1) => {
    const cart = Cart.get();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
      showToast('<i class="fa-solid fa-box"></i> Se agregó otra unidad al carrito', 'success');
    } else {
      cart.push({ ...product, quantity });
      showToast('<i class="fa-solid fa-cart-shopping"></i> Producto agregado al carrito', 'success');
    }
    Cart.save(cart);
  },
  clear: () => {
    localStorage.removeItem(Cart._getKey());
    Cart.updateNav();
  },
  updateNav: () => {
    const countEls = document.querySelectorAll('#nav-cart-count, #cart-count');
    const cart = Cart.get();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEls.forEach(el => {
      if (el.id === 'cart-count') {
        el.textContent = total;
      } else {
        el.textContent = `Carrito (${total})`;
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateNav();
});
