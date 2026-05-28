// home.js

const runInitHome = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initHome();
};

if (window.i18nReadyProcessed) {
  runInitHome();
} else {
  document.addEventListener('i18nReady', runInitHome);
}

document.addEventListener('languageChanged', runInitHome);

// Mobile search handler
function handleMobileSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      window.location.href = `/catalogo.html?search=${encodeURIComponent(query)}`;
    }
  }
}
window.handleMobileSearch = handleMobileSearch;

async function initHome() {
  const featuredGrid = document.getElementById('featured-grid');
  const categoriesGrid = document.getElementById('categories-grid');

  if (!featuredGrid || !categoriesGrid) return; // Defensive check

  // 1. Mobile Welcome Greeting Setup
  const user = Auth.getUser();
  const mobileWelcomeUsername = document.getElementById('mobile-welcome-username');
  if (mobileWelcomeUsername) {
    if (user) {
      const firstName = (user.full_name || user.username || '').split(' ')[0];
      mobileWelcomeUsername.textContent = firstName || 'Invitado 🏺';
    } else {
      mobileWelcomeUsername.textContent = 'Invitado 🏺';
    }
  }

  // Mobile User Avatar Setup
  const mobileAvatar = document.getElementById('mobile-user-avatar');
  if (mobileAvatar && user && user.avatar_url) {
    mobileAvatar.src = user.avatar_url;
  }

  // Load Stats
  try {
    const stats = await apiFetch('/stats');
    document.getElementById('stat-artisans').textContent = `+${stats.artisans_count}`;
    document.getElementById('stat-products').textContent = `+${stats.products_count}`;
    document.getElementById('stat-rating').innerHTML = `${stats.avg_rating}<i class="fa-solid fa-star"></i>`;
    document.getElementById('stat-delivery').textContent = stats.delivery_days;
  } catch (e) { console.error('Error loading stats', e); }

  // Load Categories
  try {
    const categories = await apiFetch('/categories');
    categoriesGrid.innerHTML = categories.map(c => `
      <div class="category-card" onclick="window.location.href='/catalogo.html?category=${c.slug}'">
        <span class="category-icon">${c.icon_emoji}</span>
        <div class="category-name">${c.name}</div>
        <div style="font-size:0.75rem;color:var(--color-muted);margin-top:0.3rem;">${c.count}${i18next.t('home.productsSuffix')}</div>
      </div>
    `).join('');

    // Load Mobile categories scrolling pills
    const mobileHomeCategories = document.getElementById('mobile-home-categories');
    if (mobileHomeCategories) {
      mobileHomeCategories.innerHTML = `
        <button class="category-chip active" onclick="window.location.href='/catalogo.html'">
          Todos
        </button>
      ` + categories.map(c => `
        <button class="category-chip" onclick="window.location.href='/catalogo.html?category=${c.slug}'">
          ${c.icon_emoji} ${c.name}
        </button>
      `).join('');
    }
  } catch (e) { console.error('Error loading categories', e); }

  // Load Featured Products
  try {
    const products = await apiFetch('/products?featured=true&limit=4');
    cachedProducts = products; // Cache the products for wishlist and cart
    
    if (!products || products.length === 0) {
      featuredGrid.innerHTML = `<p class="text-muted">${i18next.t('home.noFeaturedProducts')}</p>`;
      const mobileFeaturedGrid = document.getElementById('mobile-featured-grid');
      if (mobileFeaturedGrid) mobileFeaturedGrid.innerHTML = `<p class="text-muted">${i18next.t('home.noFeaturedProducts')}</p>`;
    } else {
      const cardsHtml = products.map(p => {
        const isOutOfStock = p.stock !== undefined && p.stock < 1;
        const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
        const imgUrl = p.image_url || '/img/placeholder.jpg';
        const artisanName = p.artisan?.name || '';

        return `
          <div class="product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
            <div class="product-card-image" style="position:relative;">
              <img src="${imgUrl}" alt="${p.name}" loading="lazy"/>
              
              <!-- Price pill floating over image -->
              <div class="product-price-pill">${formatPrice(p.price)}</div>
              
              <!-- Heart Wishlist button floating over image -->
              <button class="btn-wishlist ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); if (typeof Wishlist !== 'undefined') Wishlist.toggle('${p.id}')" title="Favoritos">
                <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
            <div class="product-card-body">
              <div class="product-card-name" style="font-weight:700;">${p.name}</div>
              <div class="product-artisan" style="margin-top:0.15rem;">
                <i class="fa-solid fa-store" style="font-size:0.75rem;"></i>
                <span style="font-size:0.75rem;"><strong>${artisanName}</strong></span>
              </div>
              
              <!-- Stock & Stars Row -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.25rem;">
                <div class="product-card-stock">${isOutOfStock ? 'Sin stock' : `${p.stock || 5} disponibles`}</div>
                <div class="product-card-stars">
                  <i class="fa-solid fa-star"></i>
                  <span>4.8 (${p.review_count || 4})</span>
                </div>
              </div>

              <!-- Compact Premium Cart Button -->
              <div style="display:flex;justify-content:flex-end;margin-top:auto;padding-top:0.4rem;">
                <button class="btn-card-cart ${isOutOfStock ? 'disabled' : ''}" 
                        onclick="event.stopPropagation(); ${isOutOfStock ? '' : `addToCart('${p.id}')`}" 
                        title="${isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}"
                        ${isOutOfStock ? 'disabled' : ''}>
                  <i class="${isOutOfStock ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-cart-plus'}"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      featuredGrid.innerHTML = cardsHtml;

      const mobileFeaturedGrid = document.getElementById('mobile-featured-grid');
      if (mobileFeaturedGrid) {
        mobileFeaturedGrid.innerHTML = cardsHtml;
      }
    }
  } catch (e) {
    featuredGrid.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div> <h3>${i18next.t('home.errorLoadingProducts')}</h3><p>${e.message}</p></div>`;
    const mobileFeaturedGrid = document.getElementById('mobile-featured-grid');
    if (mobileFeaturedGrid) {
      mobileFeaturedGrid.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div> <h3>${i18next.t('home.errorLoadingProducts')}</h3><p>${e.message}</p></div>`;
    }
  }

  // Local addToCart for home page
  function addToCart(productId) {
    const p = cachedProducts.find(x => x.id === productId);
    if (!p) return;
    const user = Auth.getUser();
    if (user && user.role === 'artesano' && p.artisan?.user && user.id === p.artisan.user.id) {
      showToast('No puedes comprar tus propios productos', 'warning'); 
      return;
    }
    const imgUrl = p.image_url || '';
    const artisanName = p.artisan?.name || '';
    Cart.add({ id: p.id, name: p.price, price: p.price, image: imgUrl, artisanName }, 1);
  }
  window.addToCart = addToCart;

  // Auth Area
  const navAuth = document.getElementById('nav-auth-area');
  if (navAuth) {
    const user = Auth.getUser();
    if (user) {
      let dashboard = 'dashboard-comprador.html';
      if (user.role === 'artesano') dashboard = 'dashboard-artesano.html';
      if (user.role === 'admin') dashboard = 'dashboard-admin.html';
      navAuth.innerHTML = `<a href="${dashboard}" class="btn btn-outline btn-sm" data-i18n="nav.myPanel">Mi Panel</a>`;
    } else {
      navAuth.innerHTML = `<a href="login.html" data-i18n="auth.login">Iniciar sesión</a>`;
    }
    if (typeof applyTranslations === 'function') applyTranslations();
  }

  // Intersection Observer for Reveal Animations
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}
