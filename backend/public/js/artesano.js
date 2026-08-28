let cachedProducts = [];
let artisanProfile = null;

let currentProductsPage = 1;
const productsLimit = 8; // 8 productos por página para 2 filas completas de 4 columnas en Desktop

function absoluteUrl(url) {
  if (!url) return `${window.location.origin}/img/default-avatar.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
}

function ensureMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(attrs.rel ? 'link' : 'meta');
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(selector, attrs, valueAttr, value) {
  const el = ensureMeta(selector, attrs);
  el.setAttribute(valueAttr, value);
}

function slugifyText(text) {
  return String(text || 'artesano')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getArtisanIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('id');
  if (queryId) return queryId;
  if (window.__SEO_ARTISAN_ID__) return window.__SEO_ARTISAN_ID__;
  const match = window.location.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match ? match[0] : '';
}

function updateArtisanSeo(artisan, imageUrl) {
  const name = artisan.user?.full_name || 'Artesano Art Huila';
  const title = `${name} | Artesano Art Huila`;
  const description = (artisan.cultural_history || `${name}, artesano del Huila en Art Huila.`).replace(/\s+/g, ' ').trim().slice(0, 155);
  const canonical = `${window.location.origin}/artesano/${slugifyText(name)}-${artisan.id}`;
  const image = absoluteUrl(imageUrl);

  document.title = title;
  document.getElementById('page-title').textContent = title;
  setMeta('meta[name="description"]', { name: 'description' }, 'content', description);
  setMeta('link[rel="canonical"]', { rel: 'canonical' }, 'href', canonical);
  setMeta('meta[property="og:title"]', { property: 'og:title' }, 'content', title);
  setMeta('meta[property="og:description"]', { property: 'og:description' }, 'content', description);
  setMeta('meta[property="og:url"]', { property: 'og:url' }, 'content', canonical);
  setMeta('meta[property="og:image"]', { property: 'og:image' }, 'content', image);
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, 'content', title);
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, 'content', description);
  setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, 'content', image);

  let jsonLd = document.getElementById('artisan-jsonld');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.id = 'artisan-jsonld';
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description,
    image,
    url: canonical,
    address: {
      '@type': 'PostalAddress',
      addressRegion: artisan.region?.name || 'Huila',
      addressCountry: 'CO',
    },
    worksFor: { '@type': 'Organization', name: 'Art Huila' },
  });
}

const initArtisanDetails = async () => {
  const artisanId = getArtisanIdFromUrl();
  const container = document.getElementById('artisan-container');
  const productsContainer = document.getElementById('artisan-products');

  // Nav auth logic
  const user = Auth.getUser();
  if (user) {
    document.getElementById('nav-auth').innerHTML = `<a href="${user.role === 'admin' ? '/dashboard-admin.html' : '/dashboard-artesano.html'}" class="btn btn-outline btn-sm" data-i18n="nav.myPanel">${i18next.t('nav.myPanel')}</a>`;
  } else {
    document.getElementById('nav-auth').innerHTML = `<a href="/login.html" class="btn btn-primary btn-sm" data-i18n="auth.login">${i18next.t('auth.login')}</a>`;
  }

  if (!artisanId) {
    container.innerHTML = `<div class="empty-state"><h3>${i18next.t('artisan.notFound')}</h3></div>`;
    productsContainer.innerHTML = '';
    return;
  }

  try {
    const artisan = await apiFetch(`/artisans/${artisanId}`);
    artisanProfile = artisan;
    renderArtisanDetails(artisan);
    currentProductsPage = 1;
    await loadArtisanProducts(artisan.id, currentProductsPage);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><h3>${i18next.t('artisan.errorLoadingProfile')}</h3><p>${error.message}</p></div>`;
    productsContainer.innerHTML = '';
  }
};

if (window.i18nReadyProcessed) {
  initArtisanDetails();
} else {
  document.addEventListener('i18nReady', initArtisanDetails);
}

document.addEventListener('languageChanged', () => {
  if (artisanProfile) {
    renderArtisanDetails(artisanProfile);
    loadArtisanProducts(artisanProfile.id, currentProductsPage);
  }
  const user = Auth.getUser();
  if (user) {
    document.getElementById('nav-auth').innerHTML = `<a href="${user.role === 'admin' ? '/dashboard-admin.html' : '/dashboard-artesano.html'}" class="btn btn-outline btn-sm" data-i18n="nav.myPanel">${i18next.t('nav.myPanel')}</a>`;
  } else {
    document.getElementById('nav-auth').innerHTML = `<a href="/login.html" class="btn btn-primary btn-sm" data-i18n="auth.login">${i18next.t('auth.login')}</a>`;
  }
});

async function renderArtisanDetails(artisan) {
  const container = document.getElementById('artisan-container');
  document.getElementById('page-title').textContent = `${artisan.user.full_name} | Art Huila`;

  const status = artisan.status || artisan.verification_status;
  const bannerImg = artisan.gallery && artisan.gallery[0] ? artisan.gallery[0].url : '/img/bg-hero2.jpg';
  const categoryName = window.translateCategory(artisan.category?.name || 'Artesanías');
  const regionName = artisan.region?.name || 'Huila';
  updateArtisanSeo(artisan, artisan.avatar_url || bannerImg);

  container.innerHTML = `
    <div class="artisan-profile-layout">
      <!-- 1. Portada elegante compacta (~200px) -->
      <div class="artisan-cover-banner" style="background-image: url('${bannerImg}');">
        <div class="artisan-cover-overlay"></div>
      </div>

      <!-- 2. Cabecera del Perfil (Tarjeta Horizontal) -->
      <div class="artisan-header-card">
        <div class="artisan-header-left">
          <div class="artisan-avatar-square">
            <img src="${artisan.avatar_url || '/img/default-avatar.jpg'}" alt="${artisan.user.full_name}" onerror="this.onerror=null; this.src='/img/default-avatar.jpg';" />
          </div>
          <div class="artisan-header-info">
            <div class="artisan-title-row">
              <h1 class="artisan-name-title">${artisan.user.full_name}</h1>
              ${renderTrustBadge(status)}
            </div>
            <div class="artisan-location-text">
              <i class="fa-solid fa-location-dot" style="color: #c1440e;"></i> ${regionName}, Huila
            </div>
            <div class="artisan-chips-row">
              <span class="artisan-chip">${categoryName}</span>
              <span class="artisan-chip">Artesanías Ancestrales</span>
              <span class="artisan-chip">Hecho a Mano</span>
            </div>
          </div>
        </div>

        <!-- Estadísticas horizontales a la derecha -->
        <div class="artisan-header-stats">
          <div class="artisan-stat-col">
            <span class="artisan-stat-val" id="stat-products-count">—</span>
            <span class="artisan-stat-lbl" data-i18n="artisan.statProducts">PRODUCTOS</span>
          </div>
          <div class="artisan-stat-divider"></div>
          <div class="artisan-stat-col">
            <span class="artisan-stat-val">234</span>
            <span class="artisan-stat-lbl" data-i18n="artisan.statSales">VENTAS</span>
          </div>
          <div class="artisan-stat-divider"></div>
          <div class="artisan-stat-col">
            <span class="artisan-stat-val rating-val">4.9 <i class="fa-solid fa-star"></i></span>
            <span class="artisan-stat-lbl" data-i18n="artisan.statRating">VALORACIÓN</span>
          </div>
        </div>
      </div>

      <!-- 3. Información del Artesano (3 Columnas) -->
      <div class="artisan-info-grid">
        <!-- Columna 1: Sobre el artesano -->
        <div class="info-card">
          <h3 class="info-card-title"><i class="fa-solid fa-scroll"></i> <span data-i18n="artisan.aboutSectionTitle">Sobre el artesano</span></h3>
          <p class="info-card-text">
            ${artisan.cultural_history || 'Historia y tradición artesanal. Oficio transmitido de generación en generación en el departamento del Huila, dedicado a preservar las técnicas ancestrales y la riqueza cultural de nuestra tierra.'}
          </p>
        </div>

        <!-- Columna 2: Oficios y especialidades -->
        <div class="info-card">
          <h3 class="info-card-title"><i class="fa-solid fa-palette"></i> <span data-i18n="artisan.craftsSectionTitle">Oficios y Especialidades</span></h3>
          <div class="specialties-list">
            <div class="specialty-item"><i class="fa-solid fa-gem"></i> ${categoryName}</div>
            <div class="specialty-item"><i class="fa-solid fa-hands-holding"></i> Trabajo Hecho a Mano</div>
            <div class="specialty-item"><i class="fa-solid fa-certificate"></i> Garantía de Origen ${regionName}</div>
            <div class="specialty-item"><i class="fa-solid fa-leaf"></i> Materia Prima Sostenible</div>
          </div>
        </div>

        <!-- Columna 3: Estadísticas y resumen -->
        <div class="info-card">
          <h3 class="info-card-title"><i class="fa-solid fa-chart-line"></i> <span data-i18n="artisan.statsSectionTitle">Estadísticas</span></h3>
          <div class="mini-stats-list">
            <div class="mini-stat-row">
              <span data-i18n="artisan.miniStatProducts">Productos en catálogo:</span>
              <strong id="mini-stat-products">—</strong>
            </div>
            <div class="mini-stat-row">
              <span data-i18n="artisan.miniStatSales">Ventas en la plataforma:</span>
              <strong>234</strong>
            </div>
            <div class="mini-stat-row">
              <span data-i18n="artisan.miniStatRating">Valoración promedio:</span>
              <strong class="highlight">4.9 <i class="fa-solid fa-star"></i></strong>
            </div>
            <div class="mini-stat-row">
              <span data-i18n="artisan.miniStatOrigin">Origen de elaboración:</span>
              <strong>${regionName}, Huila</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadArtisanProducts(artisanId, page) {
  const productsContainer = document.getElementById('artisan-products');
  productsContainer.innerHTML = '<div class="spinner" style="grid-column: 1/-1; padding: 3rem 0; text-align: center;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: #c1440e;"></i></div>';

  try {
    const productsRes = await apiFetch(`/catalog?artisanId=${artisanId}&page=${page}&limit=${productsLimit}`);
    const products = productsRes.data || [];
    const meta = productsRes.meta || { total: 0, totalPages: 1 };
    cachedProducts = products;

    // Update counts
    const countEl = document.getElementById('artisan-products-count');
    if (countEl) countEl.textContent = `${meta.total} ${meta.total === 1 ? 'pieza' : 'piezas'}`;

    const statCountEl = document.getElementById('stat-products-count');
    if (statCountEl) statCountEl.textContent = meta.total;

    const miniStatProducts = document.getElementById('mini-stat-products');
    if (miniStatProducts) miniStatProducts.textContent = `${meta.total} productos`;

    if (products.length === 0) {
      productsContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:3rem 0;font-size:0.9rem;">${i18next.t('artisan.noProductsPublished')}</p>`;
      document.getElementById('pagination').innerHTML = '';
    } else {
      productsContainer.innerHTML = products.map(p => {
        const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
        const imgUrl = p.images && p.images[0] ? p.images[0].url : '/img/placeholder.jpg';

        return `
          <div class="product-card" onclick="window.location.href='/producto/${p.slug}'" style="background: #ffffff; border-radius: 16px; border: 1.2px solid #e8e0d8; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-xs); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;">
            <div class="product-card-image" style="position: relative; aspect-ratio: 1.15/1; width: 100%; background: #fdfdfd; overflow: hidden;">
              <img src="${imgUrl}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy"/>

              <button class="btn-wishlist ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); if (typeof Wishlist !== 'undefined') Wishlist.toggle('${p.id}')" style="position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: white; border: 1px solid #e8e0d8; display: flex; align-items: center; justify-content: center; color: #4a3e35; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" title="Favoritos">
                <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
            <div class="product-card-body" style="padding: 0.85rem; display: flex; flex-direction: column; flex: 1;">
              <div class="product-card-name" style="font-size: 0.85rem; font-weight: 700; color: #261f1b; margin-bottom: 0.25rem; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.1rem; font-family: var(--font-body);">${window.translateProduct(p)}</div>

              ${p.review_count && p.review_count > 0 ? `
                <div style="display: flex; align-items: center; gap: 0.2rem; color: #f59e0b; font-size: 0.7rem; margin-bottom: 0.4rem;">
                  <i class="fa-solid fa-star"></i>
                  <span style="color: #4a3e35; font-weight: 700;">${Number(p.rating).toFixed(1)} (${p.review_count})</span>
                </div>
              ` : ''}

              <div class="product-card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.4rem; border-top: 1px solid #f2ece6;">
                <div class="product-price" style="font-size: 0.88rem; font-weight: 800; color: #c1440e; background: rgba(193, 68, 14, 0.08); padding: 0.2rem 0.55rem; border-radius: 6px; font-family: var(--font-body);">${formatPrice(p.price)}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      renderPagination(meta.totalPages, page);
    }
  } catch (error) {
    productsContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:3rem 0;font-size:0.8rem;">${error.message}</p>`;
    document.getElementById('pagination').innerHTML = '';
  }
}

function renderPagination(totalPages, currentPage) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToProductsPage(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

window.goToProductsPage = (page) => {
  currentProductsPage = page;
  if (artisanProfile) {
    loadArtisanProducts(artisanProfile.id, page);
    const productsHeader = document.querySelector('.artisan-products-header');
    if (productsHeader) {
      productsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<span style="background-color: #f0fdf4; color: #16a34a; border: 1.5px solid #dcfce7; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.65rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-circle-check" style="font-size: 0.68rem;"></i> VERIFICADO</span>`;
  }
  return `<span style="background-color: #fff7ed; color: #ea580c; border: 1.5px solid #ffedd5; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.65rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-hourglass-half" style="font-size: 0.68rem;"></i> POR VERIFICAR</span>`;
}

function addToCart(productId) {
  const p = cachedProducts.find(x => x.id === productId);
  if (!p) return;
  const user = Auth.getUser();
  const artisanUserId = p.artisan?.user?.id || p.artisan?.userId || artisanProfile?.user?.id;
  if (user && (user.role === 'artesano' || user.role === 'artisan') && artisanUserId && user.id === artisanUserId) {
    showToast(i18next.t('product.errorCantBuyOwnProduct', { defaultValue: 'No puedes comprar tus propios productos' }), 'warning');
    return;
  }
  const imgUrl = p.images && p.images[0] ? p.images[0].url : '';
  const artisanName = artisanProfile?.user?.full_name || p.artisan?.user?.full_name || '';
  Cart.add({ id: p.id, name: p.name, name_en: p.name_en, price: p.price, image: imgUrl, artisanName, artisanUserId }, 1);
}
