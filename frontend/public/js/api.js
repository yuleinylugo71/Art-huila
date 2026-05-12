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
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(err.message || 'Error');
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
  get: () => JSON.parse(localStorage.getItem('arthuila_cart') || '[]'),
  save: (cart) => {
    localStorage.setItem('arthuila_cart', JSON.stringify(cart));
    Cart.updateNav();
  },
  add: (product, quantity = 1) => {
    const cart = Cart.get();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    Cart.save(cart);
    showToast('Producto agregado al carrito', 'success');
  },
  updateNav: () => {
    const countEls = document.querySelectorAll('#nav-cart-count');
    const cart = Cart.get();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEls.forEach(el => {
      el.textContent = `Carrito (${total})`;
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateNav();
});
