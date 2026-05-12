// producto.js — Ficha de producto (HU-05)
(async function () {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const container = document.getElementById('product-container');
  if (!slug) { container.innerHTML = '<div class="empty-state"><div class="emoji">❌</div><h3>Producto no encontrado</h3></div>'; return; }

  try {
    const p = await apiFetch('/products/' + slug);
    document.getElementById('page-title').textContent = `${p.name} | Art Huila`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', p.meta_description || '');

    const imgs = p.images || [];
    const imgsHtml = imgs.length > 0
      ? `<div class="carousel">
          <div class="carousel-track" id="carousel-track">
            ${imgs.map(i => `<img src="${i.url}" alt="${p.name}"/>`).join('')}
          </div>
          ${imgs.length > 1 ? `<button class="carousel-btn prev" onclick="prevSlide()">&#8592;</button><button class="carousel-btn next" onclick="nextSlide()">&#8594;</button>` : ''}
        </div>`
      : `<div style="background:var(--color-bg2);border-radius:var(--radius-lg);height:350px;display:flex;align-items:center;justify-content:center;font-size:5rem;">🏺</div>`;

    const status = p.artisan?.verification_status;
    let badge = '';
    if (status === 'verified') badge = '<span class="badge badge-verified">✅ Verificado</span>';
    else if (status === 'pending') badge = '<span class="badge badge-pending">⏳ Por verificar</span>';
    else badge = '<span class="badge badge-rejected">❌ No verificado</span>';

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;">
        <div>${imgsHtml}</div>
        <div>
          <div class="flex items-center gap-1 mb-1">
            <span class="badge badge-primary">${p.category?.name || ''}</span>
            <span class="badge" style="background:var(--color-bg2);color:var(--color-muted);">📍 ${p.region?.name || ''}</span>
          </div>
          <h1 style="font-family:'Crimson Pro',serif;font-size:2.2rem;line-height:1.2;margin-bottom:0.75rem;">${p.name}</h1>
          <div style="font-size:2rem;font-weight:800;color:var(--color-primary);margin-bottom:0.75rem;">${formatPrice(p.price)}</div>
          <div style="font-size:0.9rem;color:var(--color-muted);margin-bottom:1.5rem;">Stock disponible: <strong style="color:var(--color-text);">${p.stock} unidades</strong></div>

          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
            <span style="color:var(--color-accent);">★★★★★</span>
            <span style="font-size:0.85rem;color:var(--color-muted);">0 reseñas</span>
          </div>

          <button class="btn btn-primary btn-lg btn-full mt-2" ${p.stock < 1 ? 'disabled' : ''} onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${imgs[0]?.url || ''}', '${p.artisan?.user?.full_name || ''}', '${p.artisan?.user?.id || ''}')">
            ${p.stock < 1 ? 'Sin stock' : '🛒 Agregar al carrito'}
          </button>

          <hr class="divider"/>

          <!-- Cultural Story -->
          <h2 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin-bottom:1rem;">Historia cultural</h2>
          <div style="display:grid;gap:1rem;">
            <div style="background:var(--color-bg2);padding:1rem;border-radius:var(--radius);">
              <div style="font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-muted);margin-bottom:0.4rem;">🌱 Origen</div>
              <div>${p.cultural_origin || '<em style="color:var(--color-muted);">No especificado</em>'}</div>
            </div>
            <div style="background:var(--color-bg2);padding:1rem;border-radius:var(--radius);">
              <div style="font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-muted);margin-bottom:0.4rem;">🔨 Técnica</div>
              <div>${p.technique || '<em style="color:var(--color-muted);">No especificado</em>'}</div>
            </div>
            <div style="background:var(--color-bg2);padding:1rem;border-radius:var(--radius);">
              <div style="font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-muted);margin-bottom:0.4rem;">✨ Significado</div>
              <div>${p.significance || '<em style="color:var(--color-muted);">No especificado</em>'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Artisan Profile -->
      <hr class="divider" style="margin:3rem 0 2rem;"/>
      <h2 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin-bottom:1rem;">Sobre el artesano</h2>
      <div class="artisan-mini" style="max-width:500px; cursor:pointer;" onclick="window.location.href='/artesano.html?id=${p.artisan?.id}'">
        ${p.artisan?.avatar_url
          ? `<div class="artisan-avatar" style="padding:0; overflow:hidden;"><img src="${p.artisan.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/></div>`
          : `<div class="artisan-avatar">👤</div>`}
        <div>
          <div style="font-weight:600;">${p.artisan?.user?.full_name || 'Artesano'}</div>
          <div style="font-size:0.85rem;color:var(--color-muted);">📍 ${p.artisan?.region?.name || ''}</div>
          <div style="margin-top:0.3rem;">${badge}</div>
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
        const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;
        
        reviewsContainer.innerHTML = `
          <hr class="divider" style="margin:2rem 0;"/>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <h2 style="font-family:'Crimson Pro',serif;font-size:1.8rem;margin:0;">Opiniones de clientes</h2>
            <div style="text-align:right;">
              <div style="font-size:1.5rem; font-weight:700; color:var(--color-accent);">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
              <div style="font-size:0.9rem; color:var(--color-muted);">${reviews.length} reseñas</div>
            </div>
          </div>

          <!-- Review Form -->
          ${Auth.getUser() ? `
            <div class="card card-body mb-3">
              <h3 style="font-size:1.1rem; margin-bottom:1rem;">Escribir una reseña</h3>
              <div class="form-group">
                <label class="form-label">Calificación</label>
                <select id="rev-rating" class="form-control" style="max-width:150px;">
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Comentario</label>
                <textarea id="rev-comment" class="form-control" rows="3" placeholder="Cuéntanos tu experiencia con este producto..."></textarea>
              </div>
              <button class="btn btn-primary" onclick="submitReview('${p.id}')">Publicar reseña</button>
            </div>
          ` : '<p style="background:var(--color-bg2); padding:1rem; border-radius:var(--radius); font-size:0.9rem;">Debes <a href="/login.html" style="color:var(--color-primary); font-weight:600;">iniciar sesión</a> para dejar una reseña.</p>'}

          <div id="reviews-list" style="display:grid; gap:1.5rem; margin-top:2rem;">
            ${reviews.length > 0 ? reviews.map(r => `
              <div style="border-bottom:1px solid var(--color-border); padding-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                  <div style="font-weight:600;">${r.user?.full_name || 'Usuario'}</div>
                  <div style="color:var(--color-accent);">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                </div>
                <div style="font-size:0.95rem; line-height:1.6; color:var(--color-text);">${r.comment}</div>
                <div style="font-size:0.8rem; color:var(--color-muted); margin-top:0.5rem;">${new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            `).join('') : '<p style="text-align:center; color:var(--color-muted); padding:2rem;">Aún no hay reseñas para este producto.</p>'}
          </div>
        `;
      } catch (e) { console.error(e); }
    }

    window.submitReview = async (productId) => {
      const rating = parseInt(document.getElementById('rev-rating').value);
      const comment = document.getElementById('rev-comment').value;
      if (!comment) return showToast('Por favor escribe un comentario', 'warning');

      try {
        await apiFetch('/reviews', {
          method: 'POST',
          body: JSON.stringify({ productId, rating, comment })
        });
        showToast('✅ Reseña publicada exitosamente');
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

  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">❌</div><h3>Producto no encontrado</h3><p>${e.message}</p><a href="catalogo.html" class="btn btn-primary mt-2">Volver al catálogo</a></div>`;
  }
})();

function addToCart(id, name, price, imgUrl, artisanName, artisanUserId) {
  const user = Auth.getUser();
  if (user && user.role === 'artesano' && user.id === artisanUserId) {
    showToast('No puedes comprar tus propios productos', 'warning'); 
    return;
  }
  
  Cart.add({ id, name, price, image: imgUrl, artisanName }, 1);
}
