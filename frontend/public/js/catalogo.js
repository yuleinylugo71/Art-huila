// catalogo.js — Catálogo filtrable con URL params e i18n completo
let currentPage = 1;

document.addEventListener('i18nReady', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initCatalog();
});

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initCatalog(); 
});


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

  const regionSelect = document.getElementById('region-select');
  if (regionSelect) {
    regionSelect.innerHTML = `<option value="" data-i18n="catalog.allRegions">${i18next.t('catalog.allRegions')}</option>` + regs.map(r => `
      <option value="${r.name}" ${selectedRegions.includes(r.name) ? 'selected' : ''}>${r.name}</option>
    `).join('');
  }

  const categoryFilters = document.getElementById('category-filters');
  if (categoryFilters) {
    categoryFilters.innerHTML = cats.map(c => `
      <label class="filter-option">
        <input type="checkbox" name="category" value="${c.name}" ${selectedCats.includes(c.name) ? 'checked' : ''}/>
        ${c.name}
      </label>
    `).join('');
  }

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

    // Client-side search keyword filtering
    let filteredData = data;
    const searchVal = document.getElementById('search-input')?.value.toLowerCase().trim();
    if (searchVal) {
      filteredData = data.filter(p => 
        p.name.toLowerCase().includes(searchVal) || 
        (p.artisan?.user?.full_name && p.artisan.user.full_name.toLowerCase().includes(searchVal))
      );
    }
    const finalCount = searchVal ? filteredData.length : meta.total;

    document.getElementById('results-count').textContent = i18next.t('catalog.resultCount', { count: finalCount });

    if (filteredData.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="emoji"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>${i18next.t('catalog.noResultsTitle')}</h3>
        <p>${i18next.t('catalog.noResultsDesc')}</p>
      </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = filteredData.map(p => `
      <div class="card product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
        ${p.images && p.images[0]
          ? `<div class="product-card-image" style="aspect-ratio:1/1;"><img src="${p.images[0].url}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"/></div>`
          : `<div class="product-img-placeholder" style="aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:var(--color-bg2);font-size:3rem;"><i class="fa-solid fa-vase"></i></div>`}
        <div class="card-body" style="padding:1rem;">
          <div class="product-name" style="font-size:1.15rem;font-weight:700;line-height:1.2;margin-bottom:0.25rem;">${p.name}</div>
          <div class="product-artisan" style="font-size:0.85rem;color:var(--color-muted);margin-bottom:0.75rem;">${i18next.t('catalog.byArtisan')}<strong>${p.artisan?.user?.full_name || i18next.t('catalog.anonymousArtisan')}</strong></div>
          <div class="product-price" style="font-size:1.3rem;font-weight:800;color:var(--color-primary);margin-bottom:0.5rem;">${formatPrice(p.price)}</div>
          <div class="product-meta">
            <span><i class="fa-solid fa-location-dot"></i> ${p.region?.name || 'Huila'}</span>
            <span class="badge badge-primary">${p.category?.name || ''}</span>
          </div>
          <div class="product-meta mt-1">
            <span>${i18next.t('catalog.stockLabel')}${p.stock}</span>
            ${renderTrustBadge(p.artisan?.status || p.artisan?.verification_status)}
          </div>
        </div>
      </div>
    `).join('');

    renderPagination(meta.totalPages, page);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>${i18next.t('catalog.errorLoading')}</h3><p>${e.message}</p></div>`;
  }
}

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<span class="badge badge-verified"><i class="fa-solid fa-check"></i> Verificado ✓</span>`;
  }
  if (status === 'active' || status === 'pending') {
    return `<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> Por verificar</span>`;
  }
  return '';
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
  const regions = document.getElementById('region-select').value;
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value).join(',');
  const minPrice = document.getElementById('min-price').value;
  const maxPrice = document.getElementById('max-price').value;
  const sortBy = document.getElementById('sort-select').value;
  syncFiltersToUrl({ regions, categories, minPrice, maxPrice, sortBy });
  loadProducts(1);
}

function clearFilters() {
  document.getElementById('region-select').value = '';
  document.querySelectorAll('input[name="category"]').forEach(el => el.checked = false);
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  document.getElementById('sort-select').value = 'newest';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  history.replaceState(null, '', window.location.pathname);
  loadProducts(1);
}

async function initCatalog() {
  const user = Auth.getUser();
  const navAuth = document.getElementById('nav-auth');
  if (navAuth) {
    if (user) {
      navAuth.innerHTML = `<a href="${user.role === 'admin' ? '/dashboard-admin.html' : '/dashboard-artesano.html'}" class="btn btn-outline btn-sm" data-i18n="nav.myPanel">${i18next.t('nav.myPanel')}</a>`;
    } else {
      navAuth.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm" data-i18n="auth.login">${i18next.t('auth.login')}</a>`;
    }
  }
  await loadFilters();
  const params = getUrlParams();
  loadProducts(params.page);
}
