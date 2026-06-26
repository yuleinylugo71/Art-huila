// producto.js — Ficha de producto (HU-05)
let currentProduct = null;

const initProductDetails = async () => {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const container = document.getElementById('product-container');
  if (!slug) { 
    container.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-xmark"></i></div><h3>${i18next.t('product.notFound')}</h3></div>`; 
    return; 
  }

  try {
    const p = await apiFetch('/products/' + slug);
    currentProduct = p;
    renderProductDetails(p);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-xmark"></i></div><h3>${i18next.t('product.notFound')}</h3><p>${e.message}</p><a href="catalogo.html" class="btn btn-primary mt-2">${i18next.t('nav.backToCatalog')}</a></div>`;
  }
};

if (window.i18nReadyProcessed) {
  initProductDetails();
} else {
  document.addEventListener('i18nReady', initProductDetails);
}

document.addEventListener('languageChanged', () => {
  if (currentProduct) {
    renderProductDetails(currentProduct);
  }
});function renderProductDetails(p) {
  const container = document.getElementById('product-container');
  document.getElementById('page-title').textContent = `${window.translateProduct(p)} | Art Huila`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.meta_description || '');

  const imgs = p.images || [];
  const imgUrl = imgs[0]?.url || p.image_url || '/img/placeholder.jpg';
  
  // Mapear viejos precios o detalles
  const oldPrice = p.price * 1.15;
  const isOutOfStock = p.stock !== undefined && p.stock < 1;
  const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
  const categoryName = p.category?.name ? window.translateCategory(p.category.name).toUpperCase() : 'ARTESANÍAS';
  const artisanName = p.artisan?.user?.full_name || p.artisan?.name || 'Deicy Quimbayo';
  const artisanRegion = p.artisan?.region?.name || 'Neiva, Huila';
  const artisanAvatar = p.artisan?.avatar_url || '/img/placeholder-avatar.jpg';
  const artisanSales = 234; // dummy real data

  // Share handler
  window.shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: window.translateProduct(p),
        text: p.short_description || window.translateProduct(p),
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Enlace de producto copiado al portapapeles', 'info');
    }
  };

  // Lightbox zoom function
  window.openLightbox = (url) => {
    const existing = document.getElementById('product-lightbox');
    if (existing) existing.remove();

    const lb = document.createElement('div');
    lb.id = 'product-lightbox';
    lb.style.position = 'fixed';
    lb.style.top = '0';
    lb.style.left = '0';
    lb.style.width = '100vw';
    lb.style.height = '100vh';
    lb.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    lb.style.backdropFilter = 'blur(10px)';
    lb.style.display = 'flex';
    lb.style.alignItems = 'center';
    lb.style.justifyContent = 'center';
    lb.style.zIndex = '999999';
    lb.style.cursor = 'zoom-out';
    lb.style.opacity = '0';
    lb.style.transition = 'opacity 0.25s ease';

    const isMobile = window.innerWidth <= 768;
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = isMobile ? '100%' : '90%';
    img.style.maxHeight = isMobile ? '100%' : '90%';
    img.style.width = isMobile ? '100%' : 'auto';
    img.style.objectFit = 'contain';
    img.style.borderRadius = isMobile ? '0' : '12px';
    img.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
    img.style.transform = 'scale(0.9)';
    img.style.transition = 'transform 0.25s ease';
    img.onerror = function() { this.src = '/img/placeholder.jpg'; };

    lb.appendChild(img);
    document.body.appendChild(lb);

    setTimeout(() => {
      lb.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 10);

    const closeLightbox = () => {
      lb.style.opacity = '0';
      img.style.transform = 'scale(0.9)';
      setTimeout(() => lb.remove(), 250);
    };

    lb.onclick = closeLightbox;
  };

  // Change Main Image
  window.changeMainImage = (url) => {
    const mainImg = document.getElementById('mobile-main-product-img');
    const desktopMainImg = document.getElementById('desktop-main-product-img');
    if (mainImg) mainImg.src = url;
    if (desktopMainImg) desktopMainImg.src = url;
    
    document.querySelectorAll('.product-thumb-img').forEach(img => {
      img.style.borderColor = img.src === url ? '#c1440e' : 'white';
    });
  };

  // Quantity selector logic
  window.mobileQuantity = 1;
  window.updateMobileQty = (diff) => {
    window.mobileQuantity = Math.max(1, window.mobileQuantity + diff);
    const qtyInput = document.getElementById('mobile-qty-value');
    const totalVal = document.getElementById('mobile-total-val');
    if (qtyInput) qtyInput.textContent = window.mobileQuantity;
    if (totalVal) totalVal.textContent = formatPrice(p.price * window.mobileQuantity);
  };

  // Tab changer
  window.changeTab = (tabName) => {
    document.querySelectorAll('.detail-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.detail-tab-content').forEach(c => c.style.display = 'none');
    
    const btn = document.getElementById(`tab-btn-${tabName}`);
    const content = document.getElementById(`tab-content-${tabName}`);
    if (btn) btn.classList.add('active');
    if (content) content.style.display = 'block';
  };

  const thumbnailsHtml = (imgs.length > 1)
    ? `<div class="product-thumbnails" style="position: absolute; bottom: 12px; left: 12px; display: flex; gap: 0.5rem; z-index: 10;">
         ${imgs.slice(0, 3).map((img, idx) => `
           <img src="${img.url}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" class="product-thumb-img" onclick="event.stopPropagation(); window.changeMainImage('${img.url}')" style="width: 42px; height: 42px; border-radius: 8px; border: 2px solid ${idx === 0 ? '#c1440e' : 'white'}; cursor: pointer; object-fit: cover; box-shadow: var(--shadow-sm);" />
         `).join('')}
       </div>`
    : '';

  // HTML content incorporating BOTH Desktop Layout (Grid) and Mobile Layout (Screenshot style)
  container.innerHTML = `
    <!-- DESKTOP LAYOUT (Clean Grid) -->
    <div class="desktop-only" style="padding: 2rem 0;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;">
        <div style="position:relative;">
          <div class="carousel" style="aspect-ratio: 1.15/1; border-radius: 20px; overflow: hidden; background: #faf8f5;">
            <img id="desktop-main-product-img" src="${imgUrl}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" onclick="window.openLightbox(this.src)" style="width: 100%; height: 100%; object-fit: cover; cursor: zoom-in;" />
          </div>
          <div style="display:flex; gap:0.5rem; margin-top:1rem;">
            ${imgs.map(img => `<img src="${img.url}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" onclick="window.changeMainImage('${img.url}')" style="width: 60px; height: 60px; border-radius: 8px; border: 2px solid white; cursor: pointer; object-fit: cover; box-shadow: var(--shadow-xs);" />`).join('')}
          </div>
        </div>
        <div>
          <div class="flex items-center gap-1 mb-1">
            <span class="badge badge-primary">${categoryName}</span>
            <span class="badge" style="background:var(--color-bg2);color:var(--color-muted);"><i class="fa-solid fa-location-dot"></i> ${p.region?.name || ''}</span>
          </div>
          <h1 style="font-family:var(--font-display);font-size:2.2rem;line-height:1.2;margin-bottom:0.75rem;font-weight:800;color:#261f1b;">${window.translateProduct(p)}</h1>
          <div style="font-size:2rem;font-weight:800;color:var(--color-primary);margin-bottom:0.75rem;">${formatPrice(p.price)}</div>
          <div style="font-size:0.9rem;color:var(--color-muted);margin-bottom:1.5rem;">${i18next.t('product.availableStockLabel')}: <strong style="color:var(--color-text);">${p.stock}${i18next.t('product.unitsSuffix')}</strong></div>

          <div id="desktop-rating-row" style="display:none;align-items:center;gap:0.5rem;margin-bottom:1.5rem;">
            <span id="header-stars" style="color:#f59e0b;"></span>
            <span id="header-count" style="font-size:0.85rem;color:var(--color-muted);font-weight:600;"></span>
          </div>

          <button class="btn btn-primary btn-lg btn-full mt-2" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${p.artisan?.id}')">
            ${isOutOfStock ? i18next.t('product.outOfStock') : i18next.t('product.addToCartBtn')}
          </button>

          <hr class="divider"/>

          <p style="font-size:1.05rem;line-height:1.5;margin-bottom:1.5rem;color:var(--color-text);font-style:italic;">"${p.short_description || 'Hermosa artesanía fabricada de manera tradicional.'}"</p>
          
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;font-size:0.85rem;color:var(--color-muted);">
            <span style="background:rgba(26, 138, 74, 0.1);color:#1a8a4a;padding:0.2rem 0.6rem;border-radius:999px;font-weight:600;"><i class="fa-solid fa-hand"></i> Hecho a mano</span>
            ${p.materials ? `<span style="background:var(--color-bg2);padding:0.2rem 0.6rem;border-radius:999px;"><strong>Materiales:</strong> ${p.materials}</span>` : ''}
            ${p.dimensions ? `<span style="background:var(--color-bg2);padding:0.2rem 0.6rem;border-radius:999px;"><strong>Medidas:</strong> ${p.dimensions}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- MOBILE LAYOUT (Premium Screenshot Mockup) -->
    <div class="mobile-only" style="background-color: #faf8f5; min-height: 80vh; padding: 0.5rem 1.25rem 5.5rem 1.25rem;">
      <!-- Product Image Card with floating elements -->
      <div class="mobile-image-card" style="position: relative; border-radius: 24px; overflow: hidden; background: white; box-shadow: var(--shadow-md); aspect-ratio: 1.15/1; width: 100%; margin-bottom: 1.25rem;">
        <img id="mobile-main-product-img" src="${imgUrl}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" onclick="window.openLightbox(this.src)" style="width: 100%; height: 100%; object-fit: cover; cursor: zoom-in;" />
        
        <!-- Floating wishlist heart button top-right -->
        <button class="btn-wishlist ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); if (typeof Wishlist !== 'undefined') { Wishlist.toggle('${p.id}'); }" style="position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: white; border: 1px solid #e8e0d8; display: flex; align-items: center; justify-content: center; color: #4a3e35; font-size: 0.95rem; box-shadow: var(--shadow-sm); cursor: pointer;" title="Favoritos">
          <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>

        <!-- Floating thumbnails bottom-left -->
        ${thumbnailsHtml}
      </div>

      <!-- Detail Card Content -->
      <div style="background: white; border-radius: 24px; border: 1.2px solid #e8e0d8; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-xs);">
        <!-- Category & Name -->
        <div style="font-size: 0.7rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">${categoryName}</div>
        
        <!-- Name & Price badge row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
          <h1 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; color: #261f1b; margin: 0; line-height: 1.2; flex: 1;">${window.translateProduct(p)}</h1>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="background: #c1440e; color: white; font-weight: 800; font-size: 0.95rem; padding: 0.35rem 0.85rem; border-radius: 99px; font-family: var(--font-body);">${formatPrice(p.price)}</div>
            <div style="font-size: 0.72rem; color: var(--color-muted); text-decoration: line-through; margin-top: 0.15rem; font-weight: 600;">${formatPrice(oldPrice)}</div>
          </div>
        </div>

        <!-- Rating row -->
        <div id="mobile-rating-row" style="display: none; align-items: center; gap: 0.35rem; margin-bottom: 0.75rem;">
          <div id="mobile-header-stars" style="display: flex; gap: 0.15rem; color: #f59e0b; font-size: 0.8rem;"></div>
          <span id="mobile-header-avg" style="font-size: 0.76rem; font-weight: 700; color: #261f1b;"></span>
          <span id="mobile-header-count" style="font-size: 0.72rem; color: var(--color-muted); font-weight: 600;"></span>
        </div>

        <!-- Location and Stock -->
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; font-size: 0.76rem; font-weight: 600;">
          <span style="color: var(--color-muted); display: flex; align-items: center; gap: 0.2rem;"><i class="fa-solid fa-location-dot" style="color: #c1440e;"></i> ${p.cultural_origin || 'Suaza, Huila'}</span>
          <span style="color: #c1440e; display: flex; align-items: center; gap: 0.35rem;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #c1440e; display: inline-block;"></span>
            ¡Solo ${p.stock || 5} disponibles!
          </span>
        </div>

        <!-- Quantity selector row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-top: 1.2px solid #f2ece6; border-bottom: 1.2px solid #f2ece6; padding: 0.85rem 0.25rem;">
          <span style="font-size: 0.82rem; font-weight: 700; color: #4a3e35;">Cantidad:</span>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="display: flex; align-items: center; border: 1.2px solid #e8e0d8; border-radius: 99px; background: #faf8f5; overflow: hidden; height: 32px;">
              <button onclick="window.updateMobileQty(-1)" style="border: none; background: none; width: 32px; height: 100%; color: #4a3e35; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-minus" style="font-size: 0.65rem;"></i></button>
              <span id="mobile-qty-value" style="font-size: 0.85rem; font-weight: 800; color: #261f1b; width: 24px; text-align: center; display: inline-block;">1</span>
              <button onclick="window.updateMobileQty(1)" style="border: none; background: none; width: 32px; height: 100%; color: #4a3e35; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-plus" style="font-size: 0.65rem;"></i></button>
            </div>
            <span style="font-size: 0.76rem; color: var(--color-muted); font-weight: 600; margin-left: 0.25rem;">Total: <strong id="mobile-total-val" style="color: #c1440e; font-weight: 800; font-size: 0.85rem;">${formatPrice(p.price)}</strong></span>
          </div>
        </div>

        <!-- Call to action buttons -->
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <button class="btn-mobile-action" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${p.artisan?.id}');" style="background: #c1440e; color: white; border: none; border-radius: 99px; padding: 0.75rem; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; cursor: pointer; transition: all 0.2s;">
            <i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito
          </button>
          <button class="btn-mobile-action" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${p.artisan?.id}'); window.location.href='/carrito.html';" style="background: white; color: #c1440e; border: 1.5px solid #c1440e; border-radius: 99px; padding: 0.75rem; font-weight: 700; font-size: 0.85rem; width: 100%; cursor: pointer; transition: all 0.2s; text-align: center;">
            Comprar Ahora
          </button>
        </div>
      </div>

      <!-- Tabbed Info Area -->
      <div style="background: white; border-radius: 24px; border: 1.2px solid #e8e0d8; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-xs);">
        <!-- Tabs headers -->
        <div style="display: flex; border-bottom: 1.2px solid #f2ece6; margin-bottom: 1rem;">
          <button id="tab-btn-description" class="detail-tab-btn active" onclick="window.changeTab('description')">Descripción</button>
          <button id="tab-btn-technique" class="detail-tab-btn" onclick="window.changeTab('technique')">Técnica</button>
          <button id="tab-btn-materials" class="detail-tab-btn" onclick="window.changeTab('materials')">Materiales</button>
        </div>

        <!-- Tabs Content -->
        <div id="tab-content-description" class="detail-tab-content" style="display: block;">
          <p style="font-size: 0.78rem; color: #4a3e35; line-height: 1.45; margin: 0; font-weight: 500;">
            ${p.short_description || 'Hermosa obra artesanal huilense tejida enteramente a mano con fibras naturales. Cada pieza conserva un valor ancestral transmitido por generaciones familiares.'}
          </p>
          
          <!-- Cultural significance rounded card inside description tab -->
          <div style="background: #faf8f5; border-radius: 16px; border: 1.2px solid #e8e0d8; padding: 0.85rem; margin-top: 1rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #c1440e; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.35rem;">
              <i class="fa-solid fa-landmark"></i> Significado Cultural
            </div>
            <div style="font-size: 0.74rem; color: #4a3e35; line-height: 1.4; font-weight: 500;">
              ${p.significance || 'Símbolo indiscutible de la identidad de las comunidades tejedoras huilenses. Elaborado en base a tradiciones familiares y ceremonias milenarias de la región.'}
            </div>
          </div>
        </div>

        <div id="tab-content-technique" class="detail-tab-content" style="display: none;">
          <p style="font-size: 0.78rem; color: #4a3e35; line-height: 1.45; margin: 0; font-weight: 500;">
            ${p.technique || 'Elaborado con la milenaria técnica de trenzado manual tupido. El secado, blanqueado de las fibras y el apresto se realizan bajo rigurosos métodos tradicionales de la comunidad local.'}
          </p>
        </div>

        <div id="tab-content-materials" class="detail-tab-content" style="display: none;">
          <p style="font-size: 0.78rem; color: #4a3e35; line-height: 1.45; margin: 0; font-weight: 500;">
            ${p.materials || 'Fibras naturales seleccionadas a mano, procedentes directamente de cultivos sostenibles locales del departamento del Huila.'}
          </p>
        </div>
      </div>

      <!-- Created by (Artisan profile link card) -->
      <div style="background: white; border-radius: 24px; border: 1.2px solid #e8e0d8; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-xs);">
        <div style="font-size: 0.85rem; font-weight: 800; color: #261f1b; margin-bottom: 0.85rem;">Creado por</div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="position: relative; flex-shrink: 0;">
              <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: var(--shadow-sm); background: #faf8f5;">
                <img src="${artisanAvatar}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; border-radius: 50%; background: ${p.artisan?.verification_status === 'verified' ? '#16a34a' : '#d97706'}; border: 1.5px solid white;"></div>
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 800; color: #261f1b; display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem;">
                ${artisanName} ${renderTrustBadge(p.artisan?.verification_status)}
              </div>
              <div style="font-size: 0.72rem; color: var(--color-muted); font-weight: 600; margin-top: 0.1rem; display: flex; align-items: center; gap: 0.15rem;">
                <i class="fa-solid fa-location-dot"></i> ${artisanRegion}
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 700; color: #4a3e35; margin-top: 0.15rem;">
                <span style="color: #f59e0b;"><i class="fa-solid fa-star"></i> 4.9</span>
                <span style="color: var(--color-muted);">•</span>
                <span style="color: var(--color-muted);">${artisanSales} ventas</span>
              </div>
            </div>
          </div>
          
          <button onclick="window.location.href='/artesano.html?id=${p.artisan?.id}'" style="background: #faf8f5; border: 1px solid #e8e0d8; color: #4a3e35; font-weight: 700; font-size: 0.74rem; padding: 0.45rem 1rem; border-radius: 99px; cursor: pointer; transition: all 0.2s;">Ver perfil</button>
        </div>
      </div>
    </div>
  `;

  // Reviews logic
  const reviewsContainer = document.createElement('div');
  reviewsContainer.id = 'reviews-section';
  reviewsContainer.style.marginTop = '3rem';
  container.appendChild(reviewsContainer);

  async function loadReviews() {
    try {
      const reviews = await apiFetch('/reviews/product/' + p.id);
      const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
      
      // Update header (Desktop)
      const desktopRow = document.getElementById('desktop-rating-row');
      const starsEl = document.getElementById('header-stars');
      const countEl = document.getElementById('header-count');
      
      // Update header (Mobile)
      const mobileRow = document.getElementById('mobile-rating-row');
      const mobileStarsEl = document.getElementById('mobile-header-stars');
      const mobileAvgEl = document.getElementById('mobile-header-avg');
      const mobileCountEl = document.getElementById('mobile-header-count');

      if (reviews.length > 0) {
        if (starsEl) starsEl.innerHTML = '<i class="fa-solid fa-star"></i>'.repeat(Math.round(avgRating)) + '<i class="fa-regular fa-star"></i>'.repeat(5 - Math.round(avgRating));
        if (countEl) countEl.textContent = `(${reviews.length} ${i18next.t('product.reviewsCountSuffix') || 'reseñas'})`;
        if (desktopRow) desktopRow.style.display = 'flex';

        if (mobileStarsEl) mobileStarsEl.innerHTML = '<i class="fa-solid fa-star"></i>'.repeat(Math.round(avgRating)) + '<i class="fa-regular fa-star"></i>'.repeat(5 - Math.round(avgRating));
        if (mobileAvgEl) mobileAvgEl.textContent = avgRating.toFixed(1);
        if (mobileCountEl) mobileCountEl.textContent = `(${reviews.length} ${i18next.t('product.reviewsCountSuffix') || 'reseñas'})`;
        if (mobileRow) mobileRow.style.display = 'flex';
      } else {
        if (desktopRow) desktopRow.style.display = 'none';
        if (mobileRow) mobileRow.style.display = 'none';
      }

      reviewsContainer.innerHTML = `
        <hr class="divider" style="margin:2rem 0; border-top: 1px solid #ebdcd0;"/>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding: 0 1.25rem;">
          <h2 style="font-family: var(--font-display); font-size:1.6rem; font-weight:800; color:#261f1b; margin:0;">${i18next.t('product.customerReviewsHeading')}</h2>
          <div style="text-align:right;">
            <div style="font-size:1.3rem; color:#f59e0b; display: flex; gap: 0.15rem; justify-content: flex-end;">
              ${reviews.length > 0 
                ? '<i class="fa-solid fa-star"></i>'.repeat(Math.round(avgRating)) + '<i class="fa-regular fa-star"></i>'.repeat(5 - Math.round(avgRating))
                : '<i class="fa-regular fa-star"></i>'.repeat(5)
              }
            </div>
            <div style="font-size:0.75rem; font-weight: 600; color:var(--color-muted); margin-top: 0.2rem;">${reviews.length} ${i18next.t('product.reviewsCountSuffix')}</div>
          </div>
        </div>

        <div style="padding: 0 1.25rem;">
          <!-- Review Form -->
          ${Auth.getUser() ? `
            <div class="card card-body mb-3" style="background: white; border-radius: 16px; border: 1.2px solid #e8e0d8; padding: 1.25rem; box-shadow: var(--shadow-xs);">
              <h3 style="font-family: var(--font-display); font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#261f1b;">${i18next.t('product.writeReviewHeading')}</h3>
              <p style="font-size:0.75rem; color:var(--color-muted); margin-bottom:1rem; font-weight:600;">${i18next.t('product.writeReviewHint')}</p>
              <div class="form-group" style="margin-bottom: 0.75rem;">
                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; color: #4a3e35; margin-bottom: 0.25rem; display: block;">${i18next.t('product.ratingLabel')}</label>
                <select id="rev-rating" class="form-control" style="max-width:150px; border-radius: 8px; border: 1px solid #ebdcd0; padding: 0.35rem 0.5rem; background: white; font-size: 0.8rem; font-weight: 700;">
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-size: 0.75rem; font-weight: 700; color: #4a3e35; margin-bottom: 0.25rem; display: block;">${i18next.t('product.commentLabel')}</label>
                <textarea id="rev-comment" class="form-control" rows="3" style="width: 100%; border-radius: 8px; border: 1px solid #ebdcd0; padding: 0.5rem; font-size: 0.8rem; font-family: var(--font-body); outline: none;" data-i18n-placeholder="product.commentPlaceholder" placeholder="${i18next.t('product.commentPlaceholder')}"></textarea>
              </div>
              <button class="btn btn-primary" onclick="submitReview('${p.id}')" style="background:#c1440e; color:white; border:none; border-radius:99px; padding:0.5rem 1.25rem; font-weight:700; font-size:0.78rem; cursor:pointer;">${i18next.t('product.submitReviewBtn')}</button>
            </div>
          ` : `<div style="font-size:0.82rem; color:var(--color-muted); font-weight:600; margin-bottom:1.5rem; padding: 0.25rem 0;">${i18next.t('product.mustLoginToReview')}</div>`}

          <div id="reviews-list" style="display:grid; gap:1.25rem; margin-top:1.5rem;">
            ${reviews.length > 0 ? reviews.map(r => `
              <div style="border-bottom:1px solid #ebdcd0; padding-bottom:1.25rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; align-items: center;">
                  <div style="font-weight:700; font-size:0.85rem; color:#261f1b;">${r.user?.full_name || 'Usuario'}</div>
                  <div style="color:#f59e0b; font-size: 0.75rem; display: flex; gap: 0.1rem;">
                    ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - r.rating)}
                  </div>
                </div>
                <div style="font-size:0.8rem; line-height:1.5; color:#4a3e35; font-weight:500;">${r.comment}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
                  <div style="font-size:0.7rem; color:var(--color-muted); font-weight:600;">${new Date(r.created_at).toLocaleDateString()}</div>
                  <button onclick="reportReview('${r.id}')" style="background: none; border: none; color:var(--color-muted); font-size:0.7rem; font-weight: 700; cursor: pointer; text-decoration: underline;">${i18next.t('product.reportBtn')}</button>
                </div>
              </div>
            `).join('') : `<div style="text-align:center; color:var(--color-muted); padding:3rem 0; font-size:0.85rem; font-weight:600; background: none;">${i18next.t('product.noReviewsYet')}</div>`}
          </div>
        </div>
      `;
    } catch (e) { console.error(e); }
  }

  window.reportReview = async (id) => {
    const reason = prompt(i18next.t('product.promptReportReason'));
    if (!reason) return;
    try {
      await apiFetch(`/reviews/${id}/report`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      showToast(i18next.t('product.toastReviewReported'));
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.submitReview = async (productId) => {
    const rating = parseInt(document.getElementById('rev-rating').value);
    const comment = document.getElementById('rev-comment').value;
    if (!comment) return showToast(i18next.t('product.errorCommentRequired'), 'warning');

    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ productId, rating, comment })
      });
      showToast(i18next.t('product.toastReviewSubmitted'));
      loadReviews();
    } catch (e) { showToast(e.message, 'error'); }
  };

  loadReviews();

  // Carousel logic
  let currentSlide = 0;
  const track = document.getElementById('carousel-track');
  window.prevSlide = () => {
    currentSlide = Math.max(0, currentSlide - 1);
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  };
  window.nextSlide = () => {
    currentSlide = Math.min(imgs.length - 1, currentSlide + 1);
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  };
}

function addToCart(id, name, price, imgUrl, artisanName, artisanUserId) {
  const user = Auth.getUser();
  if (user && user.role === 'artesano' && user.id === artisanUserId) {
    showToast(i18next.t('product.errorCantBuyOwnProduct'), 'warning'); 
    return;
  }
  
  Cart.add({ id, name, price, image: imgUrl, artisanName }, 1);
}

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<span style="background-color: #f0fdf4; color: #16a34a; border: 1.5px solid #dcfce7; padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.62rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; margin-left: 0.35rem; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-circle-check" style="font-size: 0.65rem;"></i> Verificado</span>`;
  }
  return `<span style="background-color: #fff7ed; color: #ea580c; border: 1.5px solid #ffedd5; padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.62rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; margin-left: 0.35rem; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-hourglass-half" style="font-size: 0.65rem;"></i> Por verificar</span>`;
}
