document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const artisanId = params.get('id');
  const container = document.getElementById('artisan-container');
  const productsContainer = document.getElementById('artisan-products');

  // Nav auth logic
  const user = Auth.getUser();
  if (user) {
    document.getElementById('nav-auth').innerHTML = `<a href="${user.role === 'admin' ? '/dashboard-admin.html' : '/dashboard-artesano.html'}" class="btn btn-outline btn-sm">Mi panel</a>`;
  } else {
    document.getElementById('nav-auth').innerHTML = `<a href="/login.html" class="btn btn-primary btn-sm">Iniciar sesión</a>`;
  }

  if (!artisanId) {
    container.innerHTML = '<div class="empty-state"><h3>Artesano no encontrado</h3></div>';
    productsContainer.innerHTML = '';
    return;
  }

  try {
    const artisan = await apiFetch(`/artisans/${artisanId}`);
    
    document.getElementById('page-title').textContent = `${artisan.user.full_name} | Art Huila`;

    const status = artisan.status || artisan.verification_status;
    let badge = '';
    if (status === 'verified') badge = '<span class="badge badge-verified"><i class="fa-solid fa-check"></i> Verificado</span>';
    else if (status === 'active' || status === 'pending') badge = '<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> Por verificar</span>';

    container.innerHTML = `
      <div class="artisan-header">
        ${artisan.avatar_url 
          ? `<div class="artisan-avatar-lg" style="padding:0; overflow:hidden;"><img src="${artisan.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/></div>`
          : `<div class="artisan-avatar-lg"><i class="fa-solid fa-user"></i></div>`}
        <h1 class="artisan-name">${artisan.user.full_name}</h1>
        <div style="color:var(--color-muted);margin-bottom:1rem;font-size:1.1rem;"><i class="fa-solid fa-location-dot"></i> ${artisan.region?.name || 'Huila'}</div>
        <div>${badge}</div>
      </div>

      <div style="background:var(--color-bg1);padding:2rem;border-radius:var(--radius-lg);border:1px solid var(--color-border);line-height:1.7;">
        <h3 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin-bottom:1rem;">Historia y Tradición</h3>
        <p>${artisan.cultural_history || 'Este artesano aún no ha compartido su historia cultural.'}</p>
      </div>

      ${artisan.gallery && artisan.gallery.length > 0 ? `
        <h3 style="font-family:'Crimson Pro',serif;font-size:1.5rem;margin:3rem 0 1rem;">Galería del Taller</h3>
        <div class="gallery-grid">
          ${artisan.gallery.map(img => `<img src="${img.url}" class="gallery-img" alt="Galería"/>`).join('')}
        </div>
      ` : ''}
    `;

    // Cargar productos del artesano
    const productsRes = await apiFetch(`/catalog?artisanId=${artisanId}&limit=50`);
    const products = productsRes.data || [];

    if (products.length === 0) {
      productsContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:3rem 0;">No hay productos publicados.</p>';
    } else {
      productsContainer.innerHTML = products.map(p => `
        <div class="card product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
          ${p.images && p.images[0]
            ? `<img class="product-img" src="${p.images[0].url}" alt="${p.name}" loading="lazy"/>`
            : `<div class="product-img-placeholder"><i class="fa-solid fa-vase"></i></div>`}
          <div class="card-body">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${formatPrice(p.price)}</div>
            <div class="product-meta mt-1">
              <span>Stock: ${p.stock}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

  } catch (error) {
    container.innerHTML = `<div class="empty-state"><h3>Error cargando perfil</h3><p>${error.message}</p></div>`;
    productsContainer.innerHTML = '';
  }
});
