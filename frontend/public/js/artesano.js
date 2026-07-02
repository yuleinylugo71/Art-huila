let cachedProducts = [];
let artisanProfile = null;

let currentProductsPage = 1;
const productsLimit = 6;

const initArtisanDetails = async () => {
  const params = new URLSearchParams(window.location.search);
  const artisanId = params.get('id');
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

  container.innerHTML = `
    <div class="artisan-profile-layout" style="position: relative; margin-bottom: 1.5rem;">
      <div class="artisan-banner" style="background: linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url('${bannerImg}') no-repeat center center/cover; height: 150px; position: relative;">
        <div class="artisan-avatar-wrapper" style="position: absolute; bottom: -36px; left: 20px; z-index: 10;">
          <div class="artisan-avatar-circle" style="width: 84px; height: 84px; border-radius: 50%; border: 3px solid white; box-shadow: var(--shadow-sm); overflow: hidden; background: #faf8f5; position: relative;">
            <img src="${artisan.avatar_url || '/img/placeholder-avatar.jpg'}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div class="online-status-dot" style="position: absolute; top: 0; right: 4px; background: #1a8a4a; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;" title="Online"></div>
          ${status === 'verified' ? `<div class="verified-avatar-badge" style="position: absolute; bottom: 0; right: 0; background: #1a8a4a; color: white; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem;"><i class="fa-solid fa-check"></i></div>` : ''}
        </div>
      </div>
 
      <div class="artisan-details-card" style="background: white; border-radius: 20px; border: 1.2px solid #e8e0d8; padding: 3rem 1.25rem 1.25rem 1.25rem; margin-top: 0; box-shadow: var(--shadow-xs);">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
          <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; color: #261f1b; margin: 0; line-height: 1.25;">${artisan.user.full_name}</h2>
          ${status === 'verified' ? `<span style="background: #1a8a4a; color: white; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 99px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.25rem; font-family: var(--font-body);"><i class="fa-solid fa-check" style="font-size: 0.55rem;"></i> Verificado</span>` : ''}
        </div>
 
        <div style="font-size: 0.76rem; color: var(--color-muted); font-weight: 600; margin-bottom: 1.15rem; display: flex; align-items: center; gap: 0.25rem; font-family: var(--font-body);">
          <i class="fa-solid fa-location-dot" style="color: #C84B11;"></i> ${artisan.region?.name || 'Huila'}
        </div>
 
        <div style="display: flex; gap: 1rem; margin-bottom: 1.15rem; border-top: 1.2px solid #f2ece6; border-bottom: 1.2px solid #f2ece6; padding: 0.75rem 0.25rem; justify-content: space-around;">
          <div style="display: flex; flex-direction: column; align-items: center; width: 30%;">
            <span style="font-size: 0.95rem; font-weight: 800; color: #261f1b; font-family: var(--font-display);" id="stat-products-count">—</span>
            <span style="font-size: 0.62rem; color: var(--color-muted); font-weight: 600; text-transform: uppercase;">Productos</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; width: 30%; border-left: 1.2px solid #f2ece6;">
            <span style="font-size: 0.95rem; font-weight: 800; color: #261f1b; font-family: var(--font-display);">234</span>
            <span style="font-size: 0.62rem; color: var(--color-muted); font-weight: 600; text-transform: uppercase;">Ventas</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; width: 30%; border-left: 1.2px solid #f2ece6;">
            <span style="font-size: 0.95rem; font-weight: 800; color: #C84B11; font-family: var(--font-display);">4.9★</span>
            <span style="font-size: 0.62rem; color: var(--color-muted); font-weight: 600; text-transform: uppercase;">Valoración</span>
          </div>
        </div>
 
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.15rem;">
          <span style="background: #faf8f5; border: 1px solid #e8e0d8; color: #C84B11; font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 99px; font-family: var(--font-body);">${window.translateCategory(artisan.category?.name || 'Artesanías')}</span>
          <span style="background: #faf8f5; border: 1px solid #e8e0d8; color: #C84B11; font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 99px; font-family: var(--font-body);">Paja Toquilla</span>
          <span style="background: #faf8f5; border: 1px solid #e8e0d8; color: #C84B11; font-size: 0.65rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 99px; font-family: var(--font-body);">Sombreros</span>
        </div>
 
        <p style="font-size: 0.78rem; color: #4a3e35; font-weight: 500; line-height: 1.4; margin: 0; font-family: var(--font-body);">
          ${artisan.cultural_history || 'Artesano de tradición y maestría única del departamento del Huila, dedicado a preservar las técnicas andinas y herencias culturales de nuestra región.'}
        </p>
      </div>
    </div>
  `;
}

async function loadArtisanProducts(artisanId, page) {
  const productsContainer = document.getElementById('artisan-products');
  productsContainer.innerHTML = '<div class="spinner" style="grid-column: 1/-1; padding: 2rem 0; text-align: center;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: #c1440e;"></i></div>';

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

    if (products.length === 0) {
      productsContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:3rem 0;font-size:0.8rem;">${i18next.t('artisan.noProductsPublished')}</p>`;
      document.getElementById('pagination').innerHTML = '';
    } else {
      productsContainer.innerHTML = products.map(p => {
        const isOutOfStock = p.stock !== undefined && p.stock < 1;
        const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
        const imgUrl = p.images && p.images[0] ? p.images[0].url : '/img/placeholder.jpg';

        return `
          <div class="product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'" style="background: white; border-radius: 16px; border: 1.2px solid #e8e0d8; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-xs);">
            <div class="product-card-image" style="position: relative; aspect-ratio: 1.15/1; width: 100%; background: #fdfdfd; overflow: hidden;">
              <img src="${imgUrl}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy"/>
              
              <button class="btn-wishlist ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); if (typeof Wishlist !== 'undefined') Wishlist.toggle('${p.id}')" style="position: absolute; bottom: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; background: white; border: 1px solid #e8e0d8; display: flex; align-items: center; justify-content: center; color: #4a3e35; font-size: 0.8rem; box-shadow: var(--shadow-xs); cursor: pointer;" title="Favoritos">
                <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
            <div class="product-card-body" style="padding: 0.65rem; display: flex; flex-direction: column; flex: 1;">
              <div class="product-card-name" style="font-size: 0.78rem; font-weight: 700; color: #261f1b; margin-bottom: 0.15rem; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 1.9rem;">${window.translateProduct(p)}</div>
              
              <div style="display: flex; align-items: center; gap: 0.15rem; color: #f59e0b; font-size: 0.65rem; margin-bottom: 0.4rem;">
                <i class="fa-solid fa-star"></i>
                <span style="color: #4a3e35; font-weight: 700; margin-left: 0.1rem;">4.9</span>
              </div>

              <div class="product-card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.25rem; border-top: 1px solid #f2ece6;">
                <div class="product-price" style="margin-top: 0; font-size: 0.8rem; font-weight: 800; color: #c1440e; background: rgba(193, 68, 14, 0.08); padding: 0.15rem 0.45rem; border-radius: 6px;">${formatPrice(p.price)}</div>
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
    const productsHeader = document.querySelector('[data-i18n="artisan.productsHeading"]');
    if (productsHeader) {
      productsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<i class="fa-solid fa-circle-check" style="color: var(--color-verified); font-size: 0.9rem; margin-left: 0.25rem;" title="${i18next.t('catalog.verifiedStatus')}"></i>`;
  }
  return '';
}

function addToCart(productId) {
  const p = cachedProducts.find(x => x.id === productId);
  if (!p) return;
  const user = Auth.getUser();
  if (user && user.role === 'artesano' && artisanProfile?.user && user.id === artisanProfile.user.id) {
    showToast(i18next.t('product.errorCantBuyOwnProduct'), 'warning'); 
    return;
  }
  const imgUrl = p.images && p.images[0] ? p.images[0].url : '';
  const artisanName = artisanProfile?.user?.full_name || '';
  Cart.add({ id: p.id, name: p.name, price: p.price, image: imgUrl, artisanName }, 1);
}
