let API = '/api/v1';

const BASE_URL = '';
window.BASE_URL = BASE_URL; // Asegurar disponibilidad global para otros archivos

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

  if (res.status === 401 && !skipAuthRefresh && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && !endpoint.startsWith('/auth/register')) {
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
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  container.appendChild(t);

  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

function formatPrice(p) {
  const value = (p === null || p === undefined || isNaN(p) || typeof p === 'string' && p.trim() === '') ? 0 : Number(p);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

const Wishlist = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('arthuila_wishlist')) || [];
    } catch (e) {
      return [];
    }
  },
  has(id) {
    return this.get().includes(id);
  },
  toggle(id) {
    let list = this.get();
    const idx = list.indexOf(id);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
    localStorage.setItem('arthuila_wishlist', JSON.stringify(list));
    
    // Toggle active state in DOM if present
    document.querySelectorAll(`.btn-wishlist[data-id="${id}"]`).forEach(btn => {
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      if (icon) {
        if (idx === -1) {
          icon.className = 'fa-solid fa-heart';
        } else {
          icon.className = 'fa-regular fa-heart';
        }
      }
    });

    if (idx === -1) {
      showToast('<i class="fa-solid fa-heart" style="color:var(--color-primary-light);"></i> Agregado a favoritos', 'success');
    } else {
      showToast('<i class="fa-regular fa-heart"></i> Removido de favoritos', 'info');
    }
  }
};

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
    const countEls = document.querySelectorAll('#nav-cart-count, #cart-count, #mobile-cart-count');
    const cart = Cart.get();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEls.forEach(el => {
      if (el.classList.contains('cart-badge') || el.id === 'cart-count' || el.id === 'mobile-cart-count') {
        el.textContent = total;
        if (el.classList.contains('cart-badge')) {
          el.style.display = total > 0 ? 'flex' : 'none';
        }
      } else {
        el.textContent = `Carrito (${total})`;
      }
    });

    // 🛍️ FLOATING CAPSULE SHOPPING CART (ONLY FOR CATALOG & HOME ON MOBILE)
    const isCatalog = window.location.pathname.includes('catalogo.html');
    const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '';
    
    if ((isCatalog || isHome) && window.innerWidth <= 768) {
      let capsule = document.getElementById('global-floating-cart-capsule');
      if (total > 0) {
        if (!capsule) {
          capsule = document.createElement('div');
          capsule.id = 'global-floating-cart-capsule';
          capsule.className = 'floating-cart-capsule';
          capsule.onclick = () => window.location.href = 'carrito.html';
          document.body.appendChild(capsule);
        }
        
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice);
        
        capsule.innerHTML = `
          <div class="capsule-left">
            <i class="fa-solid fa-cart-shopping"></i>
            <span>Ver carrito</span>
            <span class="capsule-badge">${total}</span>
          </div>
          <div class="capsule-price">${formattedTotal}</div>
        `;
        
        setTimeout(() => capsule.classList.add('show'), 50);
      } else if (capsule) {
        capsule.classList.remove('show');
        setTimeout(() => capsule.remove(), 400);
      }
    } else {
      const capsule = document.getElementById('global-floating-cart-capsule');
      if (capsule) capsule.remove();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateNav();
  renderGlobalLayout();
});

document.addEventListener('i18nReady', () => {
  renderGlobalLayout();
});

document.addEventListener('languageChanged', () => {
  renderGlobalLayout();
});

// Scrolled header state
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar-global');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
});

function renderGlobalLayout() {
  if (typeof i18next === 'undefined' || !i18next.isInitialized) {
    return;
  }
  
  const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '';
  const isCatalog = window.location.pathname.includes('catalogo.html');
  const isCart = window.location.pathname.includes('carrito.html');
  
  // 1. GLOBAL HEADER
  const oldNav = document.querySelector('nav.navbar, nav.navbar-global');
  if (oldNav) {
    const header = document.createElement('nav');
    header.className = 'navbar-global';
    
    // Add scrolled class if already scrolled
    if (window.scrollY > 20) header.classList.add('scrolled');
    
    const user = Auth.getUser();
    let authAreaHtml = '';
    if (user) {
      let dashboard = 'dashboard-comprador.html';
      if (user.role === 'artesano') dashboard = 'dashboard-artesano.html';
      if (user.role === 'admin') dashboard = 'dashboard-admin.html';
      authAreaHtml = `
        <a href="${dashboard}" class="btn btn-outline btn-sm" style="padding: 0.45rem 1rem;" data-i18n="nav.myPanel">${i18next.t('nav.myPanel')}</a>
        <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color: var(--color-muted); border: none; background: transparent; font-weight: 600; cursor: pointer; padding: 0.45rem 0.5rem;" data-i18n="auth.logout">${i18next.t('auth.logout')}</button>
      `;
    } else {
      authAreaHtml = `
        <a href="login.html" class="btn btn-primary btn-sm" style="padding: 0.45rem 1rem;" data-i18n="auth.login">${i18next.t('auth.login')}</a>
      `;
    }
    
    header.innerHTML = `
      <div class="navbar-left">
        <a href="index.html" class="navbar-brand" data-subtitle="MAESTRÍA ANCESTRAL">Art <span>Huila</span></a>
      </div>
      
      <div class="navbar-center">
        <ul class="navbar-nav">
          <li><a href="index.html" id="nav-link-home" class="${isHome ? 'active' : ''}" data-i18n="nav.home">${i18next.t('nav.home')}</a></li>
          <li><a href="catalogo.html" id="nav-link-catalog" class="${isCatalog ? 'active' : ''}" data-i18n="nav.viewCatalog">${i18next.t('nav.viewCatalog')}</a></li>
          <li><a href="carrito.html" id="nav-link-cart" class="cart-nav-btn ${isCart ? 'active' : ''}">
            <i class="fa-solid fa-cart-shopping"></i> <span data-i18n="cart.navbarCart" style="display:none;">Carrito</span>
            <span id="nav-cart-count" class="cart-badge">0</span>
          </a></li>
        </ul>
      </div>
      
      <div class="navbar-right">
        <div id="nav-auth-area" style="display: flex; align-items: center; gap: 0.5rem;">${authAreaHtml}</div>
        <div id="nav-auth" style="display:none;"></div>
        
        <div class="lang-switcher">
          <button id="btn-lang-es" class="lang-btn" onclick="window.changeLanguage('es')">ES</button>
          <span style="color: var(--color-border); font-size: 0.8rem; user-select: none;">|</span>
          <button id="btn-lang-en" class="lang-btn" onclick="window.changeLanguage('en')">EN</button>
        </div>
      </div>
    `;
    
    oldNav.replaceWith(header);
    
    // Update language buttons active class
    const lang = i18next.language || 'es';
    const btnEs = document.getElementById('btn-lang-es');
    const btnEn = document.getElementById('btn-lang-en');
    if (btnEs) btnEs.classList.toggle('active', lang === 'es');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    Cart.updateNav();
  }
  
  // 2. GLOBAL FOOTER
  const oldFooter = document.querySelector('footer, footer.footer-global');
  if (oldFooter) {
    const footer = document.createElement('footer');
    footer.className = 'footer-global';
    
    footer.innerHTML = `
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-info">
            <div class="brand">Art <span>Huila</span></div>
            <p class="subtitle" style="font-size:0.92rem;line-height:1.6;opacity:0.75;max-width:420px;">${i18next.t('home.heroSubtitle')}</p>
          </div>
          <div class="footer-links">
            <h4 style="font-family: var(--font-display); color: white; font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Navegación</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; padding-left: 0;">
              <li><a href="index.html" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">Inicio</a></li>
              <li><a href="catalogo.html" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">${i18next.t('nav.viewCatalog')}</a></li>
              <li><a href="carrito.html" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">Mi Carrito</a></li>
            </ul>
          </div>
          <div class="footer-legal">
            <h4 style="font-family: var(--font-display); color: white; font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem;">Legal</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; padding-left: 0;">
              <li><a href="#" data-i18n="home.privacy" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">${i18next.t('home.privacy')}</a></li>
              <li><a href="#" data-i18n="home.terms" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">${i18next.t('home.terms')}</a></li>
              <li><a href="#" data-i18n="home.contact" style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: all 0.2s;">${i18next.t('home.contact')}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Art Huila. Orgullosamente huilense. Hecho con ❤️ para el mundo.</p>
        </div>
      </div>
    `;
    
    oldFooter.replaceWith(footer);
  }

  // 3. BARRA DE NAVEGACIÓN MÓVIL INFERIOR DINÁMICA (Estilo Nativo App)
  let bottomNav = document.getElementById('global-mobile-bottom-nav');
  if (!bottomNav) {
    bottomNav = document.createElement('div');
    bottomNav.id = 'global-mobile-bottom-nav';
    bottomNav.className = 'mobile-bottom-nav';
    document.body.appendChild(bottomNav);
  }

  const user = Auth.getUser();
  let panelUrl = 'login.html';
  let panelLabel = i18next.t('nav.login', { defaultValue: 'Ingresar' });
  let panelIcon = 'fa-right-to-bracket';
  
  if (user) {
    panelLabel = i18next.t('nav.myPanel', { defaultValue: 'Mi Panel' });
    panelIcon = 'fa-user-gear';
    if (user.role === 'artesano') panelUrl = 'dashboard-artesano.html';
    else if (user.role === 'admin') panelUrl = 'dashboard-admin.html';
    else panelUrl = 'dashboard-comprador.html';
  }

  bottomNav.innerHTML = `
    <a href="index.html" class="mobile-bottom-nav-item ${isHome ? 'active' : ''}">
      <i class="fa-solid fa-house"></i>
      <span data-i18n="nav.home">${i18next.t('nav.home', { defaultValue: 'Inicio' })}</span>
    </a>
    <a href="catalogo.html" class="mobile-bottom-nav-item ${isCatalog ? 'active' : ''}">
      <i class="fa-solid fa-store"></i>
      <span data-i18n="nav.viewCatalog">${i18next.t('nav.viewCatalog', { defaultValue: 'Catálogo' })}</span>
    </a>
    <a href="carrito.html" class="mobile-bottom-nav-item ${isCart ? 'active' : ''}">
      <i class="fa-solid fa-cart-shopping"></i>
      <span id="mobile-cart-count" class="cart-badge">0</span>
      <span>Carrito</span>
    </a>
    <a href="${panelUrl}" class="mobile-bottom-nav-item ${window.location.pathname.includes(panelUrl) ? 'active' : ''}">
      <i class="fa-solid ${panelIcon}"></i>
      <span>${panelLabel}</span>
    </a>
  `;

  // Asegurar que el contador del carrito del menú móvil se inicialice
  Cart.updateNav();
}
