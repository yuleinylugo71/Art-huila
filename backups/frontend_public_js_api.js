let API = window.VITE_API_URL || '/api/v1';

const BASE_URL = '';
window.BASE_URL = BASE_URL; // Asegurar disponibilidad global para otros archivos

// Dynamic Injection of Tailwind CSS CDN (with Preflight disabled)
(function injectTailwind() {
  if (typeof window !== 'undefined') {
    window.tailwind = {
      config: {
        corePlugins: {
          preflight: false,
        },
        theme: {
          extend: {
            colors: {
              primary: {
                DEFAULT: '#C84B11',
                hover: '#A33A0A',
              },
              fondoCrema: '#FAFAF8',
              borde: '#EBEBEB',
            }
          }
        }
      }
    };
    const twScript = document.createElement('script');
    twScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(twScript);
  }
})();


const Auth = {
  getToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (data) => {
    // Retrieve guest cart items before setting user
    const guestCartKey = 'arthuila_cart_guest';
    let guestCart = [];
    try {
      guestCart = JSON.parse(localStorage.getItem(guestCartKey) || '[]');
    } catch (e) {
      guestCart = [];
    }

    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Merge if there are any guest items
    if (guestCart.length > 0) {
      const userCartKey = `arthuila_cart_${data.user.id}`;
      let userCart = [];
      try {
        userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');
      } catch (e) {
        userCart = [];
      }
      
      guestCart.forEach(guestItem => {
        const existing = userCart.find(item => item.id === guestItem.id);
        if (existing) {
          existing.quantity += guestItem.quantity;
        } else {
          userCart.push(guestItem);
        }
      });
      
      localStorage.setItem(userCartKey, JSON.stringify(userCart));
      localStorage.removeItem(guestCartKey);
      if (typeof Cart !== 'undefined' && Cart.updateNav) {
        Cart.updateNav();
      }
    }
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

  // Bypass ngrok warning page for API calls
  headers['ngrok-skip-browser-warning'] = 'true';

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
      const list = JSON.parse(localStorage.getItem('arthuila_wishlist')) || [];
      if (!Array.isArray(list)) return [];
      return list.filter(item => 
        item && 
        typeof item === 'string' && 
        item.trim() !== '' && 
        item !== 'undefined' && 
        item !== 'null'
      );
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

    this.updateBadges();

    // Trigger sliding drawer refresh if open
    if (window.renderFavoritesInDrawer) {
      window.renderFavoritesInDrawer();
    }
  },
  updateBadges() {
    const list = this.get();
    
    // Update mobile badge dot visibility if present on page
    const mobileFavBadgeDot = document.getElementById('mobile-fav-badge-dot');
    if (mobileFavBadgeDot) {
      mobileFavBadgeDot.style.display = list.length > 0 ? 'block' : 'none';
    }

    // Update bottom nav mobile badge count
    const mobileFavBadge = document.getElementById('mobile-fav-count');
    if (mobileFavBadge) {
      mobileFavBadge.textContent = list.length;
      mobileFavBadge.style.display = list.length > 0 ? 'inline-flex' : 'none';
    }

    // Update desktop navbar badge count if present on page
    const desktopFavBadge = document.getElementById('nav-fav-count-badge');
    if (desktopFavBadge) {
      desktopFavBadge.textContent = list.length;
      desktopFavBadge.style.display = list.length > 0 ? 'inline-flex' : 'none';
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
    const countEls = document.querySelectorAll('#nav-cart-count, #cart-count, #mobile-cart-count, #mobile-cart-badge-dot');
    const cart = Cart.get();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEls.forEach(el => {
      el.textContent = total;
      if (el.classList.contains('cart-badge') || el.classList.contains('cart-badge-dot')) {
        el.style.display = total > 0 ? 'flex' : 'none';
      }
    });

    // Floating capsule shopping cart removed by user request
    const capsule = document.getElementById('global-floating-cart-capsule');
    if (capsule) capsule.remove();
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
        <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color:white; border: none; background: transparent; font-weight: 600; cursor: pointer; padding: 0.45rem 0.5rem;" data-i18n="auth.logout">${i18next.t('auth.logout')}</button>
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
          <li><a href="#" id="nav-link-fav" class="fav-nav-btn" onclick="event.preventDefault(); window.toggleMobileFavoritesDrawer();">
            <i class="fa-solid fa-heart"></i> <span data-i18n="home.myFavorites">${i18next.t('home.myFavorites', {defaultValue: 'Favoritos'})}</span>
            <span id="nav-fav-count-badge" class="cart-badge" style="display: none; background: #c1440e;">0</span>
          </a></li>
          <li><a href="carrito.html" id="nav-link-cart" class="cart-nav-btn ${isCart ? 'active' : ''}">
            <i class="fa-solid fa-cart-shopping"></i>
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
          <p>&copy; 2026 Art Huila. Orgullosamente huilense. Hecho con <i class="fa-solid fa-heart" style="color: #c1440e; font-size: 0.85rem;"></i> para el mundo.</p>
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
  let panelIcon = 'fa-user';
  
  if (user) {
    panelLabel = i18next.t('nav.myPanel', { defaultValue: 'Mi Panel' });
    panelIcon = 'fa-user';
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
      <i class="fa-solid fa-grip"></i>
      <span data-i18n="nav.viewCatalog">${i18next.t('nav.viewCatalog', { defaultValue: 'Catálogo' })}</span>
    </a>
    <a href="javascript:void(0)" id="mobile-nav-link-fav" onclick="window.toggleMobileFavoritesDrawer()" class="mobile-bottom-nav-item">
      <i class="fa-solid fa-heart"></i>
      <span id="mobile-fav-count" class="cart-badge" style="display: none;">0</span>
      <span data-i18n="nav.favorites">${i18next.t('nav.favorites', { defaultValue: 'Favoritos' })}</span>
    </a>
    <a href="carrito.html" class="mobile-bottom-nav-item ${isCart ? 'active' : ''}">
      <i class="fa-solid fa-cart-shopping"></i>
      <span id="mobile-cart-count" class="cart-badge">0</span>
      <span data-i18n="nav.cart">${i18next.t('nav.cart', { defaultValue: 'Carrito' })}</span>
    </a>
    <a href="${panelUrl}" class="mobile-bottom-nav-item ${window.location.pathname.includes(panelUrl) ? 'active' : ''}">
      <i class="fa-solid ${panelIcon}"></i>
      <span data-i18n="nav.myPanel">${panelLabel}</span>
    </a>
  `;

  // Asegurar que el contador del carrito del menú móvil se inicialice
  Cart.updateNav();

  // 4. GLOBAL FAVORITES DRAWER FOR ALL PAGES
  let favDrawer = document.getElementById('mobile-fav-drawer');
  if (!favDrawer) {
    favDrawer = document.createElement('div');
    favDrawer.id = 'mobile-fav-drawer';
    favDrawer.className = 'mobile-fav-drawer-panel';
    favDrawer.innerHTML = `
      <!-- Drawer Header -->
      <div class="fav-drawer-header" style="padding: 1.25rem; border-bottom: 1px solid #ebdcd0; display: flex; justify-content: space-between; align-items: center; background: #faf8f5;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fa-solid fa-heart" style="color: #c1440e; font-size: 1.1rem;"></i>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: #261f1b; margin: 0;" data-i18n="home.myFavorites">${i18next.t('home.myFavorites', {defaultValue: 'Mis Favoritos'})}</h3>
        </div>
        <button onclick="window.toggleMobileFavoritesDrawer()" style="background: none; border: none; font-size: 1.2rem; color: #4a3e35; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; transition: background-color 0.2s;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <!-- Drawer Body -->
      <div id="mobile-fav-drawer-list" style="flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
        <!-- Loaded dynamically via JS -->
      </div>
    `;
    document.body.appendChild(favDrawer);
  }

  let favBackdrop = document.getElementById('mobile-fav-drawer-backdrop');
  if (!favBackdrop) {
    favBackdrop = document.createElement('div');
    favBackdrop.id = 'mobile-fav-drawer-backdrop';
    favBackdrop.className = 'mobile-fav-drawer-backdrop';
    favBackdrop.onclick = () => window.toggleMobileFavoritesDrawer();
    document.body.appendChild(favBackdrop);
  }

  // Ensure favorites badges are updated
  Wishlist.updateBadges();
}

window.togglePasswordVisibility = function(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
};

window.updateUploadLabel = function(input, defaultText) {
  const container = input.previousElementSibling;
  if (!container) return;
  const subtitleEl = container.querySelector('.upload-subtitle');
  if (!subtitleEl) return;
  if (input.files && input.files.length > 0) {
    if (input.files.length === 1) {
      subtitleEl.textContent = input.files[0].name;
      subtitleEl.style.color = 'var(--color-primary)';
      subtitleEl.style.fontWeight = 'bold';
    } else {
      subtitleEl.textContent = `${input.files.length} archivos seleccionados`;
      subtitleEl.style.color = 'var(--color-primary)';
      subtitleEl.style.fontWeight = 'bold';
    }
  } else {
    subtitleEl.textContent = defaultText || 'Selecciona tus archivos';
    subtitleEl.style.color = '';
    subtitleEl.style.fontWeight = '';
  }
};

// Global Wishlist/Favorites drawer controllers
window.toggleMobileFavoritesDrawer = function() {
  const drawer = document.getElementById('mobile-fav-drawer');
  const backdrop = document.getElementById('mobile-fav-drawer-backdrop');
  const favBtn = document.getElementById('nav-link-fav');
  const mobileFavBtn = document.getElementById('mobile-nav-link-fav');
  if (!drawer) return;

  const isOpen = drawer.classList.contains('open');
  if (!isOpen) {
    window.renderFavoritesInDrawer();
    drawer.classList.add('open');
    if (favBtn) favBtn.classList.add('active');
    if (mobileFavBtn) mobileFavBtn.classList.add('active');
    if (backdrop) {
      backdrop.style.display = 'block';
      backdrop.offsetHeight; // force layout reflow
      backdrop.classList.add('active');
    }
  } else {
    drawer.classList.remove('open');
    if (favBtn) favBtn.classList.remove('active');
    if (mobileFavBtn) mobileFavBtn.classList.remove('active');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => {
        if (!drawer.classList.contains('open')) {
          backdrop.style.display = 'none';
        }
      }, 300);
    }
  }
};

window.renderFavoritesInDrawer = async function() {
  const drawerList = document.getElementById('mobile-fav-drawer-list');
  if (!drawerList) return;

  const wishIds = Wishlist.get();
  Wishlist.updateBadges();

  if (wishIds.length === 0) {
    drawerList.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 3rem 1rem; text-align: center; color: var(--color-muted);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #faf8f5; border: 1.2px solid #e8e0d8; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #ebdcd0;"><i class="fa-solid fa-heart"></i></div>
        <h4 style="font-family: var(--font-body); font-weight: 700; color: #261f1b; margin: 0;">Aún no tienes favoritos</h4>
        <p style="font-size: 0.76rem; margin: 0; max-width: 200px;">Guarda tus artesanías favoritas para tenerlas siempre a mano.</p>
      </div>
    `;
    return;
  }

  drawerList.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <i class="fa-solid fa-circle-notch fa-spin" style="color: #c1440e; font-size: 1.5rem;"></i>
    </div>
  `;

  try {
    const allProducts = await apiFetch('/products');
    const wishProducts = allProducts.filter(p => wishIds.includes(p.id));

    // Self-healing: if some wishlist IDs are invalid/deleted, sync localStorage
    const validWishIds = wishProducts.map(p => p.id);
    if (validWishIds.length !== wishIds.length) {
      localStorage.setItem('arthuila_wishlist', JSON.stringify(validWishIds));
      Wishlist.updateBadges();
    }

    if (wishProducts.length === 0) {
      drawerList.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 3rem 1rem; text-align: center; color: var(--color-muted);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #faf8f5; border: 1.2px solid #e8e0d8; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #ebdcd0;"><i class="fa-solid fa-heart"></i></div>
          <h4 style="font-family: var(--font-body); font-weight: 700; color: #261f1b; margin: 0;">Aún no tienes favoritos</h4>
          <p style="font-size: 0.76rem; margin: 0; max-width: 200px;">Guarda tus artesanías favoritas para tenerlas siempre a mano.</p>
        </div>
      `;
      return;
    }

    // Cache loaded wish products as well
    window.cachedProducts = [...(window.cachedProducts || []), ...wishProducts];

    drawerList.innerHTML = wishProducts.map(p => {
      const isOutOfStock = p.stock !== undefined && p.stock < 1;
      const imgUrl = p.image_url || '/img/placeholder.jpg';
      const artisanName = p.artisan?.user?.full_name || p.artisan?.name || '';
      
      return `
        <div class="fav-drawer-card" style="display: flex; gap: 1rem; background: #ffffff; padding: 0.85rem; border-radius: 12px; border: 1.2px solid #ebdcd0; align-items: center; position: relative;">
          <div class="imagen" style="width: 64px; height: 64px; flex-shrink: 0; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="window.location.href='/producto.html?slug=${p.slug}'">
            <img src="${imgUrl}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div class="info" style="flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0;">
            <span class="vendedor" style="font-size: 0.65rem; color: var(--color-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${artisanName}</span>
            <h4 style="font-family: var(--font-body); font-weight: 700; font-size: 0.85rem; color: #261f1b; margin: 0; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;" onclick="window.location.href='/producto.html?slug=${p.slug}'">${window.translateProduct(p)}</h4>
            <div class="precio" style="font-weight: 800; color: #c1440e; font-size: 0.9rem; margin-top: 0.1rem;">${formatPrice(p.price)}</div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem;">
              <button onclick="event.stopPropagation(); Wishlist.toggle('${p.id}'); if (typeof runInitHome === 'function') runInitHome();" style="flex: 1; border: 1.2px solid #c1440e; background: none; color: #c1440e; border-radius: 6px; padding: 0.35rem 0.5rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">Quitar</button>
              <button onclick="event.stopPropagation(); if (!${isOutOfStock}) { window.addWishToCart('${p.id}'); }" style="flex: 1; border: none; background: #c1440e; color: white; border-radius: 6px; padding: 0.35rem 0.5rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'Sin Stock' : 'Llevar'}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error rendering favorites in drawer', err);
    drawerList.innerHTML = `<p style="font-size:0.75rem;color:red;text-align:center;">Error al cargar favoritos</p>`;
  }
};

window.addWishToCart = function(productId) {
  const p = (window.cachedProducts || []).find(x => x.id === productId);
  if (!p) return;
  const user = Auth.getUser();
  if (user && user.role === 'artesano' && p.artisan?.user && user.id === p.artisan.user.id) {
    showToast('No puedes comprar tus propios productos', 'warning'); 
    return;
  }
  const imgUrl = p.image_url || '';
  const artisanName = p.artisan?.name || '';
  Cart.add({ id: p.id, name: p.name, price: p.price, image: imgUrl, artisanName }, 1);
  Wishlist.toggle(p.id);
  if (typeof runInitHome === 'function') runInitHome();
};


