// home.js — Lógica de la página principal
(async function () {
  // Update navbar based on session
  const user = Auth.getUser();
  const navArea = document.getElementById('nav-auth-area');
  if (user) {
    let href = '/catalogo.html';
    if (user.role === 'artesano') href = '/dashboard-artesano.html';
    if (user.role === 'admin') href = '/dashboard-admin.html';
    navArea.innerHTML = `
      <a href="${href}" class="btn btn-outline btn-sm">Mi Panel</a>
      <button onclick="Auth.logout()" class="btn btn-ghost btn-sm">Salir</button>
    `;
  }

  // Load featured products
  const grid = document.getElementById('featured-grid');
  try {
    const result = await apiFetch('/catalog?limit=8&sortBy=newest');
    const products = result.data || [];
    if (products.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="emoji">🏺</div><h3>Aún no hay productos</h3><p>Los artesanos pronto publicarán sus obras.</p></div>';
      return;
    }
    grid.innerHTML = products.map(p => `
      <div class="card product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
        ${p.images && p.images[0]
          ? `<img class="product-img" src="${p.images[0].url}" alt="${p.name}" loading="lazy"/>`
          : `<div class="product-img-placeholder">🏺</div>`}
        <div class="card-body">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${formatPrice(p.price)}</div>
          <div class="product-meta">
            <span>📍 ${p.region?.name || 'Huila'}</span>
            <span class="badge badge-primary">${p.category?.name || ''}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><h3>No se pudo cargar el catálogo</h3><p>${e.message}</p></div>`;
  }
})();
