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
});

function renderProductDetails(p) {
  const container = document.getElementById('product-container');
  document.getElementById('page-title').textContent = `${p.name} | Art Huila`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.meta_description || '');

  const imgs = p.images || [];
  let carouselHtml = '';
  if (imgs.length > 0) {
    carouselHtml = `
      <div class="carousel">
        <div class="carousel-track" id="carousel-track">
          ${imgs.map(i => `<img src="${i.url}" alt="${p.name}"/>`).join('')}
        </div>
        ${imgs.length > 1 ? `<button class="carousel-btn prev" onclick="prevSlide()">&#8592;</button><button class="carousel-btn next" onclick="nextSlide()">&#8594;</button>` : ''}
      </div>
      ${imgs.length > 1 ? `
        <div class="carousel-dots-container">
          ${imgs.map((_, idx) => `
            <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="window.setSlide(${idx})"></span>
          `).join('')}
        </div>
      ` : ''}
    `;
  } else {
    carouselHtml = `<div style="background:var(--color-bg2);border-radius:var(--radius-lg);height:350px;display:flex;align-items:center;justify-content:center;font-size:5rem;"><i class="fa-solid fa-vase"></i></div>`;
  }

  const status = p.artisan?.verification_status;
  let badgeHtml = '';
  if (status === 'pending') badgeHtml = `<span class="artisan-mini-badge" style="color:var(--color-pending);"><i class="fa-solid fa-hourglass-half"></i> ${i18next.t('catalog.pendingStatus')}</span>`;
  else if (status === 'verified') badgeHtml = `<span class="artisan-mini-badge"><i class="fa-solid fa-circle-check"></i> Artesano Verificado</span>`;
  else badgeHtml = `<span class="artisan-mini-badge" style="color:var(--color-muted);"><i class="fa-solid fa-xmark"></i> Inactivo</span>`;

  const user = Auth.getUser();
  const isOwner = user && p.artisan?.user && user.id === p.artisan.user.id;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;">
      <div>${carouselHtml}</div>
      <div>
        <div class="flex items-center gap-1 mb-1" style="display:flex; gap:0.5rem; margin-bottom: 0.5rem;">
          <span class="badge badge-primary">${p.category?.name || ''}</span>
          <span class="badge" style="background:var(--color-border);color:var(--color-text);"><i class="fa-solid fa-location-dot"></i> ${p.region?.name || ''}</span>
        </div>
        <h1 style="font-family:var(--font-display);font-size:2.2rem;line-height:1.2;margin-bottom:0.75rem;">${p.name}</h1>
        <div style="font-size:2rem;font-weight:800;color:var(--color-primary);margin-bottom:0.75rem;">${formatPrice(p.price)}</div>
        <div style="font-size:0.9rem;color:var(--color-muted);margin-bottom:1.5rem;">${i18next.t('product.availableStockLabel')}: <strong style="color:var(--color-text);">${p.stock} ${i18next.t('product.unitsSuffix')}</strong></div>
 
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
          <span id="header-stars" style="color:var(--color-primary);"><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i></span>
          <span id="header-count" style="font-size:0.85rem;color:var(--color-muted);">0 ${i18next.t('product.reviewsCountSuffix')}</span>
        </div>
 
        <button class="btn btn-primary btn-lg btn-full mt-2" style="box-shadow:var(--shadow-sm); border-radius:12px;" ${p.stock < 1 || isOwner ? 'disabled' : ''} onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${imgs[0]?.url || ''}', '${p.artisan?.user?.full_name || ''}', '${p.artisan?.user?.id || ''}')">
          ${p.stock < 1 ? i18next.t('product.outOfStock') : (isOwner ? i18next.t('product.isYourProduct') : i18next.t('product.addToCartBtn'))}
        </button>
 
        <hr class="divider"/>
 
        <!-- Detalles Extra -->
        ${p.short_description ? `<p style="font-size:1.05rem;line-height:1.5;margin-bottom:1.5rem;color:var(--color-text);font-style:italic;">"${p.short_description}"</p>` : ''}
        
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;font-size:0.85rem;color:var(--color-muted);">
          ${p.is_handmade !== false ? `<span style="background:rgba(26, 138, 74, 0.1);color:#1a8a4a;padding:0.2rem 0.6rem;border-radius:999px;font-weight:600;"><i class="fa-solid fa-hand"></i> ${i18next.t('product.handmadeLabel')}</span>` : ''}
          ${p.materials ? `<span style="background:var(--color-accent-warm);padding:0.2rem 0.6rem;border-radius:999px;border:1px solid var(--color-border);"><strong>${i18next.t('product.materialsLabel')}:</strong> ${p.materials}</span>` : ''}
          ${p.dimensions ? `<span style="background:var(--color-accent-warm);padding:0.2rem 0.6rem;border-radius:999px;border:1px solid var(--color-border);"><strong>${i18next.t('product.dimensionsLabel')}:</strong> ${p.dimensions}</span>` : ''}
          ${p.weight ? `<span style="background:var(--color-accent-warm);padding:0.2rem 0.6rem;border-radius:999px;border:1px solid var(--color-border);"><strong>${i18next.t('product.weightLabel')}:</strong> ${p.weight}</span>` : ''}
        </div>
 
        ${p.care_instructions ? `
        <div style="margin-bottom:1.5rem;background:var(--color-accent-warm);padding:1rem;border-radius:12px;font-size:0.9rem;border:1px solid var(--color-border);">
          <div style="font-weight:600;margin-bottom:0.3rem;">${i18next.t('product.careHeading')}</div>
          <div>${p.care_instructions}</div>
        </div>` : ''}
 
        <!-- Ficha Técnica Ancestral (Acordeón) -->
        <h2 style="font-family:var(--font-display);font-size:1.4rem;margin:1.8rem 0 1rem 0;color:var(--color-text);">${i18next.t('product.historyHeading')}</h2>
        
        <div class="ancestral-accordion">
          <!-- Accordion Origen -->
          <div class="accordion-item">
            <button class="accordion-header active" onclick="window.toggleAccordion('acc-origen', this)">
              <span><i class="fa-solid fa-seedling" style="color:var(--color-primary);margin-right:0.6rem;"></i> ${i18next.t('product.originLabel')}</span>
              <i class="fa-solid fa-chevron-down arrow"></i>
            </button>
            <div id="acc-origen" class="accordion-content open" style="max-height: 250px; padding-bottom: 1.25rem;">
              <p>${p.cultural_origin || `Este producto proviene de la rica tradición cultural de los artesanos del departamento del Huila.`}</p>
            </div>
          </div>
          
          <!-- Accordion Técnica -->
          <div class="accordion-item">
            <button class="accordion-header" onclick="window.toggleAccordion('acc-tecnica', this)">
              <span><i class="fa-solid fa-hammer" style="color:var(--color-primary);margin-right:0.6rem;"></i> ${i18next.t('product.techniqueLabel')}</span>
              <i class="fa-solid fa-chevron-down arrow"></i>
            </button>
            <div id="acc-tecnica" class="accordion-content">
              <p>${p.technique || `Elaborado meticulosamente a mano utilizando técnicas ancestrales heredadas de generación en generación.`}</p>
            </div>
          </div>
          
          <!-- Accordion Materiales -->
          <div class="accordion-item">
            <button class="accordion-header" onclick="window.toggleAccordion('acc-materiales', this)">
              <span><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--color-primary);margin-right:0.6rem;"></i> ${i18next.t('product.significanceLabel')}</span>
              <i class="fa-solid fa-chevron-down arrow"></i>
            </button>
            <div id="acc-materiales" class="accordion-content">
              <p>${p.significance || `Hecho a base de materiales orgánicos locales y sostenibles de la región andina.`}</p>
            </div>
          </div>
        </div>

        <script>
          window.toggleAccordion = (id, btn) => {
            const content = document.getElementById(id);
            const items = document.querySelectorAll('.accordion-content');
            const headers = document.querySelectorAll('.accordion-header');
            
            // Toggle clicked accordion item
            const isOpen = content.classList.toggle('open');
            btn.classList.toggle('active', isOpen);
          };
        </script>
      </div>
    </div>
 
    <!-- Artisan Profile Card -->
    <hr class="divider" style="margin:3rem 0 2rem;"/>
    <h2 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:1rem;">${i18next.t('product.aboutArtisanHeading')}</h2>
    
    <div class="artisan-mini-card" onclick="window.location.href='/artesano.html?id=${p.artisan?.id}'" style="cursor:pointer; max-width:480px;">
      ${p.artisan?.avatar_url
        ? `<img src="${p.artisan.avatar_url}" class="artisan-mini-avatar" style="object-fit:cover;"/>`
        : `<div class="artisan-mini-avatar"><i class="fa-solid fa-user"></i></div>`}
      <div class="artisan-mini-info">
        <div class="artisan-mini-name">${p.artisan?.user?.full_name || i18next.t('catalog.anonymousArtisan')}</div>
        <div style="font-size:0.8rem;color:var(--color-muted);margin-bottom:0.15rem;"><i class="fa-solid fa-location-dot"></i> ${p.artisan?.region?.name || ''}</div>
        ${badgeHtml}
      </div>
    </div>
  `;
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
      
      // Update header
      const starsEl = document.getElementById('header-stars');
      const countEl = document.getElementById('header-count');
      if (starsEl) starsEl.innerHTML = '<i class="fa-solid fa-star"></i>'.repeat(Math.round(avgRating)) + '<i class="fa-regular fa-star"></i>'.repeat(5 - Math.round(avgRating));
      if (countEl) countEl.textContent = `${reviews.length} ${i18next.t('product.reviewsCountSuffix')}`;

      reviewsContainer.innerHTML = `
        <hr class="divider" style="margin:2rem 0;"/>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <h2 style="font-family:'Crimson Pro',serif;font-size:1.8rem;margin:0;">${i18next.t('product.customerReviewsHeading')}</h2>
          <div style="text-align:right;">
            <div style="font-size:1.5rem; font-weight:700; color:var(--color-accent);">${'<i class="fa-solid fa-star"></i>'.repeat(Math.round(avgRating))}${'<i class="fa-regular fa-star"></i>'.repeat(5 - Math.round(avgRating))}</div>
            <div style="font-size:0.9rem; color:var(--color-muted);">${reviews.length} ${i18next.t('product.reviewsCountSuffix')}</div>
          </div>
        </div>

        <!-- Review Form -->
        ${Auth.getUser() ? `
          <div class="card card-body mb-3">
            <h3 style="font-size:1.1rem; margin-bottom:1rem;">${i18next.t('product.writeReviewHeading')}</h3>
            <p style="font-size:0.85rem; color:var(--color-muted); margin-bottom:1rem;">${i18next.t('product.writeReviewHint')}</p>
            <div class="form-group">
              <label class="form-label">${i18next.t('product.ratingLabel')}</label>
              <select id="rev-rating" class="form-control" style="max-width:150px;">
                <option value="5">★★★★★ (5)</option>
                <option value="4">★★★★☆ (4)</option>
                <option value="3">★★★☆☆ (3)</option>
                <option value="2">★★☆☆☆ (2)</option>
                <option value="1">★☆☆☆☆ (1)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${i18next.t('product.commentLabel')}</label>
              <textarea id="rev-comment" class="form-control" rows="3" data-i18n-placeholder="product.commentPlaceholder" placeholder="${i18next.t('product.commentPlaceholder')}"></textarea>
            </div>
            <button class="btn btn-primary" onclick="submitReview('${p.id}')">${i18next.t('product.submitReviewBtn')}</button>
          </div>
        ` : `<p style="background:var(--color-bg2); padding:1rem; border-radius:var(--radius); font-size:0.9rem;">${i18next.t('product.mustLoginToReview')}</p>`}

        <div id="reviews-list" style="display:grid; gap:1.5rem; margin-top:2rem;">
          ${reviews.length > 0 ? reviews.map(r => `
            <div style="border-bottom:1px solid var(--color-border); padding-bottom:1.5rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <div style="font-weight:600;">${r.user?.full_name || 'Usuario'}</div>
                <div style="color:var(--color-accent);">${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - r.rating)}</div>
              </div>
              <div style="font-size:0.95rem; line-height:1.6; color:var(--color-text);">${r.comment}</div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                <div style="font-size:0.8rem; color:var(--color-muted);">${new Date(r.created_at).toLocaleDateString()}</div>
                <button class="btn btn-ghost btn-xs" onclick="reportReview('${r.id}')" style="color:var(--color-muted); font-size:0.75rem;">${i18next.t('product.reportBtn')}</button>
              </div>
            </div>
          `).join('') : `<p style="text-align:center; color:var(--color-muted); padding:2rem;">${i18next.t('product.noReviewsYet')}</p>`}
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
  
  function updateDots() {
    document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
  }
  
  window.setSlide = (idx) => {
    currentSlide = idx;
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    updateDots();
  };
  
  window.prevSlide = () => {
    currentSlide = Math.max(0, currentSlide - 1);
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    updateDots();
  };
  
  window.nextSlide = () => {
    currentSlide = Math.min(imgs.length - 1, currentSlide + 1);
    if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    updateDots();
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
