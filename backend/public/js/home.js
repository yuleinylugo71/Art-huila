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

async function initHome() {
  const featuredGrid = document.getElementById('featured-grid');
  const categoriesGrid = document.getElementById('categories-grid');

  if (!featuredGrid || !categoriesGrid) return; // Defensive check

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
  } catch (e) { console.error('Error loading categories', e); }

  // Load Featured Products
  try {
    const products = await apiFetch('/products?featured=true&limit=4');
    if (!products || products.length === 0) {
      featuredGrid.innerHTML = `<p class="text-muted">${i18next.t('home.noFeaturedProducts')}</p>`;
    } else {
      featuredGrid.innerHTML = products.map(p => `
        <div class="product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
          <div class="product-card-image">
            <span class="badge badge-${p.status}">${p.status === 'verified' ? i18next.t('home.verifiedBadge') : i18next.t('home.pendingBadge')}</span>
            <img src="${p.image_url || '/img/placeholder.jpg'}" alt="${p.name}" loading="lazy"/>
          </div>
          <div class="product-card-body">
            <div class="product-artisan">
              <img src="${p.artisan.avatar_url || '/img/default-avatar.jpg'}" alt="${p.artisan.name}"/>
              <span>${p.artisan.name}</span>
            </div>
            <h3 class="product-card-name">${p.name}</h3>
            <div class="product-stars">
              <span class="stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></span>
              <span>(${p.review_count})</span>
            </div>
            <div class="product-price">${formatPrice(p.price)}</div>
            <button class="btn btn-sm">${i18next.t('home.viewDetailsBtn')}</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    featuredGrid.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>${i18next.t('home.errorLoadingProducts')}</h3><p>${e.message}</p></div>`;
  }

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
