// producto.js — Ficha de producto (HU-05)
let currentProduct = null;

function absoluteUrl(url) {
  if (!url) return `${window.location.origin}/img/placeholder.jpg`;
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

function getProductSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get('slug');
  if (querySlug) return querySlug;
  if (window.__SEO_PRODUCT_SLUG__) return window.__SEO_PRODUCT_SLUG__;
  const match = window.location.pathname.match(/\/producto\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function slugifyText(text) {
  return String(text || 'artesano')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function updateProductSeo(p, imageUrl) {
  const lang = i18next.language || 'es';
  const title = (lang === 'en' ? p.meta_title_en : p.meta_title) || `${window.translateProduct(p)} | Art Huila`;
  const metaDescription = lang === 'en' ? p.meta_description_en : p.meta_description;
  const description = (metaDescription || window.translateProductField(p, 'short_description') || `${window.translateProduct(p)}: artesanía del Huila hecha a mano.`).replace(/\s+/g, ' ').trim();
  const canonical = `${window.location.origin}/producto/${encodeURIComponent(p.slug)}`;
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

  let jsonLd = document.getElementById('product-jsonld');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.id = 'product-jsonld';
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: window.translateProduct(p),
    description,
    image,
    url: canonical,
    category: p.category?.name,
    brand: { '@type': 'Brand', name: 'Art Huila' },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'COP',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonical,
    },
  });
}

const initProductDetails = async () => {
  const slug = getProductSlugFromUrl();
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
    container.innerHTML = `<div class="empty-state"><div class="emoji"><i class="fa-solid fa-xmark"></i></div><h3>${i18next.t('product.notFound')}</h3><p>${e.message}</p><a href="/catalogo.html" class="btn btn-primary mt-2">${i18next.t('nav.backToCatalog')}</a></div>`;
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
  updateProductSeo(p, imgUrl);

  // Mapear viejos precios o detalles
  const oldPrice = p.price * 1.15;
  const isOutOfStock = p.stock !== undefined && p.stock < 1;
  const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
  const categoryName = p.category?.name ? window.translateCategory(p.category.name).toUpperCase() : 'ARTESANÍAS';
  const productName = window.translateProduct(p);
  const productDescription = window.translateProductField(p, 'short_description', 'Hermosa artesanía fabricada de manera tradicional.');
  const productOrigin = window.translateProductField(p, 'cultural_origin', 'Suaza, Huila');
  const productTechnique = window.translateProductField(p, 'technique', 'Elaborado con técnica artesanal tradicional.');
  const productSignificance = window.translateProductField(p, 'significance', 'Pieza con valor cultural de la región.');
  const productMaterials = window.translateProductField(p, 'materials', '');
  const productDimensions = window.translateProductField(p, 'dimensions', '');
  const productWeight = window.translateProductField(p, 'weight', '');
  const productCare = window.translateProductField(p, 'care_instructions', '');
  const artisanName = p.artisan?.user?.full_name || p.artisan?.name || 'Deicy Quimbayo';
  const artisanRegion = p.artisan?.region?.name || 'Neiva, Huila';
  const artisanAvatar = p.artisan?.avatar_url || '/img/placeholder-avatar.jpg';
  const artisanProfileUrl = p.artisan?.id ? `/artesano/${slugifyText(artisanName)}-${p.artisan.id}` : '/artesanos.html';
  const artisanUserId = p.artisan?.user?.id || p.artisan?.userId || p.artisan_user_id || '';
  const user = Auth.getUser();
  const isOwnProduct = !!(user && (user.role === 'artesano' || user.role === 'artisan') && artisanUserId && user.id === artisanUserId);
  const artisanSales = 234; // dummy real data

  // Share handler
  window.shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: window.translateProduct(p),
        text: productDescription || window.translateProduct(p),
        url: `${window.location.origin}/producto/${encodeURIComponent(p.slug)}`
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

  // Change Main Image (mobile)
  window.changeMainImage = (url) => {
    const mainImg = document.getElementById('mobile-main-product-img');
    const desktopMainImg = document.getElementById('desktop-main-product-img');
    if (mainImg) mainImg.src = url;
    if (desktopMainImg) desktopMainImg.src = url;

    document.querySelectorAll('.product-thumb-img').forEach(img => {
      img.style.borderColor = img.src === url ? '#c1440e' : 'white';
    });
  };

  // Change Main Image — Desktop premium gallery with active thumb state
  window.changeMainImagePd = (url, thumbEl) => {
    const desktopMainImg = document.getElementById('desktop-main-product-img');
    if (desktopMainImg) desktopMainImg.src = url;
    document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
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
    <!-- DESKTOP LAYOUT (Premium Editorial) -->
    <div class="desktop-only">
      <div class="pd-wrapper">
        <div class="pd-grid">

          <!-- COL 1: Galería -->
          <div class="pd-gallery">
            <!-- Miniaturas verticales (izquierda) -->
            <div class="pd-thumbs">
              ${imgs.length > 0
                ? imgs.slice(0, 5).map((img, idx) => `
                    <div class="pd-thumb ${idx === 0 ? 'active' : ''}"
                         onclick="window.changeMainImagePd('${img.url}', this)">
                      <img src="${img.url}"
                           onerror="this.onerror=null;this.src='/img/placeholder.jpg';"
                           alt="" />
                    </div>`).join('')
                : `<div class="pd-thumb active">
                     <img src="${imgUrl}"
                          onerror="this.onerror=null;this.src='/img/placeholder.jpg';" />
                   </div>`
              }
            </div>

            <!-- Imagen principal -->
            <div class="pd-main-img-wrap" onclick="window.openLightbox(document.getElementById('desktop-main-product-img').src)">
              <img id="desktop-main-product-img"
                   src="${imgUrl}"
                   alt="${window.translateProduct(p)}"
                   onerror="this.onerror=null;this.src='/img/placeholder.jpg';" />
            </div>
          </div>

          <!-- COL 2: Información -->
          <div class="pd-info">

            <!-- Breadcrumb -->
            <nav class="pd-breadcrumb" aria-label="breadcrumb">
              <a href="/">Inicio</a>
              <span class="pd-breadcrumb-sep">›</span>
              <a href="/catalogo.html">${categoryName}</a>
              <span class="pd-breadcrumb-sep">›</span>
              <span class="pd-breadcrumb-current">${window.translateProduct(p)}</span>
            </nav>

            <!-- Artesano como etiqueta superior -->
            <div class="pd-artisan-tag">
                <a href="${artisanProfileUrl}" class="pd-artisan-tag-link">
                <span class="pd-artisan-tag-avatar">
                  <img src="${artisanAvatar}"
                       onerror="this.onerror=null;this.src='/img/placeholder.jpg';"
                       alt="${artisanName}" />
                </span>
                <span class="pd-artisan-tag-name">${artisanName}</span>
                ${renderTrustBadge(p.artisan?.verification_status)}
              </a>
            </div>

            <!-- Nombre -->
            <h1 class="pd-name">${window.translateProduct(p)}</h1>

            <!-- Precio -->
            <div class="pd-price-row">
              <span class="pd-price">${formatPrice(p.price)}</span>
            </div>

            <!-- Rating (oculto hasta que carguen reseñas) -->
            <div id="desktop-rating-row" class="pd-rating">
              <span id="header-stars" style="color:#f59e0b; font-size:0.9rem;"></span>
              <span id="header-count" style="font-size:0.82rem;color:var(--color-muted);font-weight:600;"></span>
            </div>

            <!-- Stock -->
            <div class="pd-stock">
              <span class="pd-stock-dot ${p.stock <= 5 ? 'low' : ''}"></span>
              Stock disponible:&nbsp;<strong>${p.stock} unidades</strong>
            </div>

            <!-- Botón carrito -->
            ${isOwnProduct ? `
              <button class="pd-btn-cart" disabled style="opacity: 0.75; cursor: not-allowed; background: #8c827a; color: white; border-color: #8c827a; font-weight: 700;">
                <i class="fa-solid fa-user-shield"></i> Tu producto publicado
              </button>
            ` : `
              <button class="pd-btn-cart"
                      ${isOutOfStock ? 'disabled' : ''}
                      onclick="addToCart('${p.id}', '${productName.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${artisanUserId}')">
                ${isOutOfStock ? i18next.t('product.outOfStock') : i18next.t('product.addToCartBtn')}
              </button>
            `}

            <!-- Divisor -->
            <hr class="pd-divider" />

            <!-- Descripción -->
            <p class="pd-description">${productDescription}</p>

            <!-- Detalles artesanales -->
            <div class="pd-craft-details">
              <span class="pd-handmade-badge">
                <i class="fa-solid fa-hand"></i> Hecho a mano
              </span>
              ${productMaterials ? `
                <div class="pd-craft-row">
                  <span class="pd-craft-label"><i class="fa-solid fa-layer-group"></i> Materiales</span>
                  <span class="pd-craft-value">${productMaterials}</span>
                </div>` : ''}
              ${productDimensions ? `
                <div class="pd-craft-row">
                  <span class="pd-craft-label"><i class="fa-solid fa-ruler-combined"></i> Medidas</span>
                  <span class="pd-craft-value">${productDimensions}</span>
                </div>` : ''}
              ${productWeight ? `
                <div class="pd-craft-row">
                  <span class="pd-craft-label"><i class="fa-solid fa-weight-hanging"></i> Peso</span>
                  <span class="pd-craft-value">${productWeight}</span>
                </div>` : ''}
              ${productCare ? `
                <div class="pd-craft-row">
                  <span class="pd-craft-label"><i class="fa-solid fa-hand-holding-heart"></i> Cuidado</span>
                  <span class="pd-craft-value">${productCare}</span>
                </div>` : ''}
            </div>

          </div><!-- /pd-info -->
        </div><!-- /pd-grid -->
      </div><!-- /pd-wrapper -->
    </div><!-- /desktop-only -->


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
          <span style="color: var(--color-muted); display: flex; align-items: center; gap: 0.2rem;"><i class="fa-solid fa-location-dot" style="color: #c1440e;"></i> ${productOrigin}</span>
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
          ${isOwnProduct ? `
            <button class="btn-mobile-action" disabled style="background: #8c827a; color: white; border: none; border-radius: 99px; padding: 0.75rem; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; opacity: 0.75; cursor: not-allowed;">
              <i class="fa-solid fa-user-shield"></i> Tu producto publicado
            </button>
          ` : `
            <button class="btn-mobile-action" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${p.id}', '${productName.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${artisanUserId}');" style="background: #c1440e; color: white; border: none; border-radius: 99px; padding: 0.75rem; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; cursor: pointer; transition: all 0.2s;">
              <i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito
            </button>
            <button class="btn-mobile-action" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${p.id}', '${productName.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${artisanName}', '${artisanUserId}'); window.location.href='/carrito.html';" style="background: white; color: #c1440e; border: 1.5px solid #c1440e; border-radius: 99px; padding: 0.75rem; font-weight: 700; font-size: 0.85rem; width: 100%; cursor: pointer; transition: all 0.2s; text-align: center;">
              Comprar Ahora
            </button>
          `}
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
            ${productDescription}
          </p>

          <!-- Cultural significance rounded card inside description tab -->
          <div style="background: #faf8f5; border-radius: 16px; border: 1.2px solid #e8e0d8; padding: 0.85rem; margin-top: 1rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #c1440e; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.35rem;">
              <i class="fa-solid fa-landmark"></i> Significado Cultural
            </div>
            <div style="font-size: 0.74rem; color: #4a3e35; line-height: 1.4; font-weight: 500;">
              ${productSignificance}
            </div>
          </div>
        </div>

        <div id="tab-content-technique" class="detail-tab-content" style="display: none;">
          <p style="font-size: 0.78rem; color: #4a3e35; line-height: 1.45; margin: 0; font-weight: 500;">
            ${productTechnique}
          </p>
        </div>

        <div id="tab-content-materials" class="detail-tab-content" style="display: none;">
          <p style="font-size: 0.78rem; color: #4a3e35; line-height: 1.45; margin: 0; font-weight: 500;">
            ${productMaterials || 'Fibras naturales seleccionadas a mano, procedentes directamente de cultivos sostenibles locales del departamento del Huila.'}
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

          <button onclick="window.location.href='${artisanProfileUrl}'" style="background: #faf8f5; border: 1px solid #e8e0d8; color: #4a3e35; font-weight: 700; font-size: 0.74rem; padding: 0.45rem 1rem; border-radius: 99px; cursor: pointer; transition: all 0.2s;">Ver perfil</button>
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
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
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
  const ownerId = artisanUserId || currentProduct?.artisan?.user?.id || currentProduct?.artisan?.userId || currentProduct?.artisan_user_id;
  if (user && (user.role === 'artesano' || user.role === 'artisan') && ownerId && user.id === ownerId) {
    showToast(i18next.t('product.errorCantBuyOwnProduct', { defaultValue: 'No puedes comprar tus propios productos' }), 'warning');
    return;
  }

  Cart.add({
    id,
    name: currentProduct?.name || name,
    name_en: currentProduct?.name_en,
    price,
    image: imgUrl,
    artisanName,
    artisanUserId: ownerId,
  }, 1);
}

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<span style="background-color: #f0fdf4; color: #16a34a; border: 1.5px solid #dcfce7; padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.62rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; margin-left: 0.35rem; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-circle-check" style="font-size: 0.65rem;"></i> Verificado</span>`;
  }
  return `<span style="background-color: #fff7ed; color: #ea580c; border: 1.5px solid #ffedd5; padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.62rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle; margin-left: 0.35rem; text-transform: uppercase; font-family: var(--font-body);"><i class="fa-solid fa-hourglass-half" style="font-size: 0.65rem;"></i> Por verificar</span>`;
}
