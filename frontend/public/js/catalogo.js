// catalogo.js — Catálogo filtrable con URL params
let currentPage = 1;

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    regions: p.get('regions') || '',
    categories: p.get('categories') || '',
    minPrice: p.get('minPrice') || '',
    maxPrice: p.get('maxPrice') || '',
    sortBy: p.get('sortBy') || 'newest',
    page: parseInt(p.get('page') || '1'),
  };
}

function syncFiltersToUrl(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  history.replaceState(null, '', '?' + sp.toString());
}

async function loadFilters() {
  const [cats, regs] = await Promise.all([apiFetch('/categories'), apiFetch('/regions')]);
  const params = getUrlParams();
  const selectedRegions = params.regions ? params.regions.split(',') : [];
  const selectedCats = params.categories ? params.categories.split(',') : [];

  document.getElementById('region-filters').innerHTML = regs.map(r => `
    <label class="filter-option">
      <input type="checkbox" name="region" value="${r.name}" ${selectedRegions.includes(r.name) ? 'checked' : ''}/>
      ${r.name}
    </label>
  `).join('');

  document.getElementById('category-filters').innerHTML = cats.map(c => `
    <label class="filter-option">
      <input type="checkbox" name="category" value="${c.name}" ${selectedCats.includes(c.name) ? 'checked' : ''}/>
      ${c.name}
    </label>
  `).join('');

  const { minPrice, maxPrice, sortBy } = params;
  if (minPrice) document.getElementById('min-price').value = minPrice;
  if (maxPrice) document.getElementById('max-price').value = maxPrice;
  document.getElementById('sort-select').value = sortBy;
}

async function loadProducts(page = 1) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  const params = getUrlParams();
  currentPage = page;

  const qs = new URLSearchParams();
  if (params.regions) qs.set('regions', params.regions);
  if (params.categories) qs.set('categories', params.categories);
  if (params.minPrice) qs.set('minPrice', params.minPrice);
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice);
  qs.set('sortBy', params.sortBy);
  qs.set('page', page);
  qs.set('limit', 20);

  try {
    const result = await apiFetch('/catalog?' + qs.toString());
    const { data, meta } = result;
    document.getElementById('results-count').textContent = `${meta.total} resultado${meta.total !== 1 ? 's' : ''} encontrado${meta.total !== 1 ? 's' : ''}`;

    if (data.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="emoji">🔍</div>
        <h3>Sin resultados</h3>
        <p>Intenta cambiar los filtros para encontrar productos.</p>
      </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = data.map(p => `
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
          <div class="product-meta mt-1">
            <span>Stock: ${p.stock}</span>
            ${p.artisan?.verification_status === 'verified' ? '<span class="badge badge-verified">✅ Verificado</span>' : 
              (p.artisan?.verification_status === 'pending' ? '<span class="badge badge-pending">⏳ Por verificar</span>' : 
              '<span class="badge badge-rejected">❌ No verificado</span>')}
          </div>
        </div>
      </div>
    `).join('');

    renderPagination(meta.totalPages, page);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">⚠️</div><h3>Error al cargar</h3><p>${e.message}</p></div>`;
  }
}

function renderPagination(totalPages, current) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

function goToPage(page) {
  const p = new URLSearchParams(window.location.search);
  p.set('page', page);
  history.replaceState(null, '', '?' + p.toString());
  loadProducts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
  const regions = Array.from(document.querySelectorAll('input[name="region"]:checked')).map(el => el.value).join(',');
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value).join(',');
  const minPrice = document.getElementById('min-price').value;
  const maxPrice = document.getElementById('max-price').value;
  const sortBy = document.getElementById('sort-select').value;
  syncFiltersToUrl({ regions, categories, minPrice, maxPrice, sortBy });
  loadProducts(1);
}

function clearFilters() {
  document.querySelectorAll('input[name="region"], input[name="category"]').forEach(el => el.checked = false);
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  document.getElementById('sort-select').value = 'newest';
  history.replaceState(null, '', window.location.pathname);
  loadProducts(1);
}

// Init
(async function () {
  const user = Auth.getUser();
  const navAuth = document.getElementById('nav-auth');
  if (user) {
    navAuth.innerHTML = `<a href="${user.role === 'admin' ? '/dashboard-admin.html' : '/dashboard-artesano.html'}" class="btn btn-outline btn-sm">Mi panel</a>`;
  } else {
    navAuth.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Iniciar sesión</a>`;
  }
  await loadFilters();
  const params = getUrlParams();
  loadProducts(params.page);
})();
