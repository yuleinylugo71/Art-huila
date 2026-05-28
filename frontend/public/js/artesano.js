let cachedProducts = [];
let artisanProfile = null;

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
  const productsContainer = document.getElementById('artisan-products');

  document.getElementById('page-title').textContent = `${artisan.user.full_name} | Art Huila`;

  const status = artisan.status || artisan.verification_status;
  let badgeHtml = '';
  if (status === 'active' || status === 'pending') {
    badgeHtml = `<div style="margin-top: 0.5rem;"><span class="badge badge-pending">${i18next.t('artisan.statusPendingBadge')}</span></div>`;
  }

  container.innerHTML = `
    <div class="artisan-header">
      ${artisan.avatar_url 
        ? `<div class="artisan-avatar-lg" style="padding:0; overflow:hidden;"><img src="${artisan.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/></div>`
        : `<div class="artisan-avatar-lg"><i class="fa-solid fa-user"></i></div>`}
      <h1 class="artisan-name" style="display:flex;align-items:center;justify-content:center;gap:0.45rem;">
        ${artisan.user.full_name}
        ${status === 'verified' ? `<i class="fa-solid fa-circle-check" style="color: var(--color-verified); font-size: 1.4rem;" title="${i18next.t('catalog.verifiedStatus')}"></i>` : ''}
      </h1>
      <div style="color:var(--color-muted);margin-bottom:1rem;font-size:1.1rem;"><i class="fa-solid fa-location-dot"></i> ${artisan.region?.name || 'Huila'}</div>
      ${badgeHtml}
    </div>

    <div style="background:var(--color-bg1);padding:2rem;border-radius:var(--radius-lg);border:1px solid var(--color-border);line-height:1.7;">
      <h3 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin-bottom:1rem;">${i18next.t('artisan.historyTradition')}</h3>
      <p>${artisan.cultural_history || i18next.t('artisan.noHistoryText')}</p>
    </div>

    ${artisan.gallery && artisan.gallery.length > 0 ? `
      <h3 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin:3rem 0 1rem;">${i18next.t('artisan.tallerGallery')}</h3>
      <div class="gallery-grid">
        ${artisan.gallery.map(img => `<img src="${img.url}" class="gallery-img" alt="Galería"/>`).join('')}
      </div>
    ` : ''}
  `;

  // Cargar productos del artesano
  const productsRes = await apiFetch(`/catalog?artisanId=${artisan.id}&limit=50`);
  const products = productsRes.data || [];
  cachedProducts = products;

  if (products.length === 0) {
    productsContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:3rem 0;">${i18next.t('artisan.noProductsPublished')}</p>`;
  } else {
    productsContainer.innerHTML = products.map(p => {
      const isOutOfStock = p.stock !== undefined && p.stock < 1;
      const user = Auth.getUser();
      const isOwner = user && artisanProfile?.user && user.id === artisanProfile.user.id;

      return `
        <div class="product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
          ${p.images && p.images[0]
            ? `<div class="product-card-image"><img src="${p.images[0].url}" alt="${p.name}" loading="lazy"/></div>`
            : `<div class="product-card-image product-img-placeholder" style="display:flex;align-items:center;justify-content:center;font-size:3rem;"><i class="fa-solid fa-vase"></i></div>`}
          <div class="product-card-body">
            <div class="product-card-name">${p.name}</div>
            <div class="product-artisan">
              <i class="fa-solid fa-store"></i>
              <span><strong>${artisanProfile?.user?.full_name || ''}</strong></span>
              ${renderTrustBadge(artisanProfile?.status || artisanProfile?.verification_status)}
            </div>
            <div class="product-card-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
              <div class="product-price" style="margin-top:0;">${formatPrice(p.price)}</div>
              <button class="btn-card-cart ${isOutOfStock ? 'disabled' : ''} ${isOwner ? 'owner' : ''}" 
                      onclick="event.stopPropagation(); ${isOutOfStock ? '' : `addToCart('${p.id}')`}" 
                      title="${isOutOfStock ? i18next.t('product.outOfStock') : (isOwner ? i18next.t('product.isYourProduct') : i18next.t('cart.toastProductAdded'))}"
                      ${isOutOfStock || isOwner ? 'disabled' : ''}>
                <i class="${isOutOfStock ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-cart-plus'}"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

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
