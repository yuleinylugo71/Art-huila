const API = 'http://localhost:3000/api/v1';

const Auth = {
  getToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (data) => {
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
  clearSession: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  logout: async () => {
    const refreshToken = Auth.getRefreshToken();
    try {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
          skipAuthRefresh: true,
        });
      }
    } catch (error) {
      console.warn('No se pudo invalidar la sesion en servidor:', error);
    } finally {
      Auth.clearSession();
      window.location.href = '/login.html';
    }
  },
  requireRole: (role) => {
    const user = Auth.getUser();
    if (!user) { window.location.href = '/login.html'; return false; }
    if (user.role !== role) { window.location.href = '/index.html'; return false; }
    return true;
  }
};

async function requestNewAccessToken() {
  const refreshToken = Auth.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error('Refresh token invalido');

  const data = await res.json();
  Auth.setSession({
    ...data,
    user: data.user || Auth.getUser(),
  });
  return data.access_token;
}

async function apiFetch(endpoint, options = {}) {
  const { skipAuthRefresh, ...fetchOptions } = options;
  const isFormData = fetchOptions.body instanceof FormData;
  const headers = { ...(fetchOptions.headers || {}) };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API}${endpoint}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuthRefresh && endpoint !== '/auth/refresh') {
    try {
      const newAccessToken = await requestNewAccessToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${newAccessToken}` };
      res = await fetch(`${API}${endpoint}`, { ...fetchOptions, headers: retryHeaders });
    } catch {
      Auth.clearSession();
      window.location.href = '/login.html';
      throw new Error('Sesion expirada. Inicia sesion nuevamente.');
    }
  }

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
      showToast('<i class="fa-solid fa-box"></i> Se agrego otra unidad al carrito', 'success');
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
