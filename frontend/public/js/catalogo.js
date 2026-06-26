// catalogo.js — Catálogo filtrable con URL params e i18n completo
let currentPage = 1;
let cachedCategories = [];
let cachedRegions = [];
let cachedProducts = [];

const runInitCatalog = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initCatalog();
};

if (window.i18nReadyProcessed) {
  runInitCatalog();
} else {
  document.addEventListener('i18nReady', runInitCatalog);
}

document.addEventListener('languageChanged', runInitCatalog);

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  
  // Soporta tanto 'categories' (plural) como 'category' (singular, enviado desde index.html)
  const rawCategoryParam = p.get('categories') || p.get('category') || '';
  
  // Si las categorías ya están en caché, resuelve slugs a nombres de categoría oficiales en la DB
  let resolvedCategories = '';
  if (rawCategoryParam && cachedCategories.length > 0) {
    resolvedCategories = rawCategoryParam.split(',').map(raw => {
      const matched = cachedCategories.find(c => 
        c.name.toLowerCase() === raw.toLowerCase() || 
        c.slug.toLowerCase() === raw.toLowerCase()
      );
      return matched ? matched.name : raw;
    }).join(',');
  } else {
    resolvedCategories = rawCategoryParam;
  }

  return {
    regions: p.get('regions') || '',
    categories: resolvedCategories,
    materials: p.get('materials') || '',
    minPrice: p.get('minPrice') || '',
    maxPrice: p.get('maxPrice') || '',
    sortBy: p.get('sortBy') || 'newest',
    page: parseInt(p.get('page') || '1'),
    search: p.get('search') || '',
  };
}

function syncFiltersToUrl(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  history.replaceState(null, '', '?' + sp.toString());
}

async function loadFilters() {
  const [cats, regs] = await Promise.all([apiFetch('/categories'), apiFetch('/regions')]);
  cachedCategories = cats;
  cachedRegions = regs;

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
        <input type="checkbox" name="category" value="${c.name}" ${selectedCats.includes(c.name) ? 'checked' : ''} onchange="applyFilters()"/>
        ${window.translateCategory(c.name)}
      </label>
    `).join('');
  }

  const { minPrice, maxPrice, sortBy, search, materials } = params;
  if (minPrice) document.getElementById('min-price').value = minPrice;
  if (maxPrice) document.getElementById('max-price').value = maxPrice;
  
  // Sync materials checkboxes
  const selectedMaterials = materials ? materials.split(',') : [];
  document.querySelectorAll('input[name="material"]').forEach(cb => {
    cb.checked = selectedMaterials.includes(cb.value);
  });

  // Sync price-range checkboxes
  document.querySelectorAll('input[name="price-range"]').forEach(cb => {
    const val = cb.value;
    const [min, max] = val.split('-');
    cb.checked = (minPrice === min && maxPrice === max);
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = sortBy;
  
  const mobileSort = document.getElementById('mobile-sort-select');
  if (mobileSort) mobileSort.value = sortBy;

  const searchInput = document.getElementById('search-input');
  if (searchInput && search) {
    searchInput.value = search;
  }
  const mobileSearch = document.getElementById('mobile-search-input');
  if (mobileSearch && search) {
    mobileSearch.value = search;
  }

  // 🏷️ Sync Category Chips Scroller
  syncCategoryChips();
}

function getCategoryIcon(slug) {
  const normalized = (slug || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const icons = {
    'ceramica': 'fa-jar',
    'ceramicas': 'fa-jar',
    'orfebreria': 'fa-gem',
    'orfebrerias': 'fa-gem',
    'joyeria': 'fa-gem',
    'sombrereria': 'fa-hat-cowboy',
    'sombreros': 'fa-hat-cowboy',
    'talla-en-madera': 'fa-tree',
    'talla-madera': 'fa-tree',
    'tejeduria': 'fa-scissors',
    'tejedurias': 'fa-scissors'
  };
  return icons[normalized] || 'fa-palette';
}

function syncCategoryChips() {
  const chipsScroller = document.getElementById('category-chips-scroller');
  const checkedCats = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
  const allActive = checkedCats.length === 0;

  if (chipsScroller && cachedCategories.length > 0) {
    let chipsHtml = `
      <button class="category-chip ${allActive ? 'active' : ''}" onclick="selectCategoryChip('')" data-i18n="catalog.allCategories">
        ${i18next.t('catalog.allCategories')}
      </button>
    `;
    chipsHtml += cachedCategories.map(c => {
      const isActive = checkedCats.includes(c.name);
      return `
        <button class="category-chip ${isActive ? 'active' : ''}" onclick="selectCategoryChip('${c.name}')">
          ${window.translateCategory(c.name)}
        </button>
      `;
    }).join('');
    chipsScroller.innerHTML = chipsHtml;
  }
  
  // Render mobile horizontal scrolling category chips (no emojis, active in terracota)
  const circularContainer = document.getElementById('mobile-categories-carousel');
  if (circularContainer && cachedCategories.length > 0) {
    let circularHtml = `
      <button class="mobile-category-chip-btn ${allActive ? 'active' : ''}" onclick="selectCategoryChip('')">
        <i class="fa-solid fa-border-all"></i>
        <span data-i18n="catalog.allCategories">${i18next.t('catalog.allCategories')}</span>
      </button>
    `;
    circularHtml += cachedCategories.map(c => {
      const isActive = checkedCats.includes(c.name);
      const iconClass = getCategoryIcon(c.slug);
      return `
        <button class="mobile-category-chip-btn ${isActive ? 'active' : ''}" onclick="selectCategoryChip('${c.name}')">
          <i class="fa-solid ${iconClass}"></i>
          <span>${window.translateCategory(c.name)}</span>
        </button>
      `;
    }).join('');
    circularContainer.innerHTML = circularHtml;
  }
}

window.selectCategoryChip = (catName) => {
  document.querySelectorAll('input[name="category"]').forEach(el => {
    if (catName === '') {
      el.checked = false;
    } else {
      el.checked = (el.value === catName);
    }
  });
  
  syncCategoryChips();
  applyFilters();
};

async function loadProducts(page = 1) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  const params = getUrlParams();
  currentPage = page;

  const qs = new URLSearchParams();
  if (params.regions) qs.set('regions', params.regions);
  if (params.categories) qs.set('categories', params.categories);
  if (params.materials) qs.set('materials', params.materials);
  if (params.minPrice) qs.set('minPrice', params.minPrice);
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice);
  if (params.search) qs.set('search', params.search);
  qs.set('sortBy', params.sortBy);
  qs.set('page', page);
  qs.set('limit', 20);

  try {
    const result = await apiFetch('/catalog?' + qs.toString());
    const { data, meta } = result;

    // Cache the products for cart additions
    cachedProducts = data;

    document.getElementById('results-count').textContent = i18next.t('catalog.resultCount', { count: meta.total });

    if (data.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="emoji"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>${i18next.t('catalog.noResultsTitle')}</h3>
        <p>${i18next.t('catalog.noResultsDesc')}</p>
      </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = data.map(p => {
      const isOutOfStock = p.stock !== undefined && p.stock < 1;
      const user = Auth.getUser();
      const isOwner = user && p.artisan?.user && user.id === p.artisan.user.id;
      const isWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
      const artisanName = p.artisan?.user?.full_name || p.artisan?.name || i18next.t('catalog.anonymousArtisan');

      // Match Figma mockups: select items have "OFERTA" badge
      const hasOffer = p.name.toLowerCase().includes('sombrero') || p.name.toLowerCase().includes('mochila');
      const offerBadge = hasOffer ? `<div class="product-offer-tag">OFERTA</div>` : '';
      
      const startingAtText = i18next.t('catalog.startingAt', { price: formatPrice(p.price) });
      const starsHtml = `<div class="product-rating-stars" style="color: #ffb800; font-size: 0.8rem; margin: 0.2rem 0;">
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
      </div>`;

      const btnText = isOutOfStock ? 'Sin stock' : (isOwner ? 'Tu producto' : 'Añadir al Carrito');

      return `
        <div class="product-card" onclick="window.location.href='/producto.html?slug=${p.slug}'">
          <div class="product-card-image" style="position:relative;">
            ${p.images && p.images[0]
              ? `<img src="${p.images[0].url}" alt="${window.translateProduct(p)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" loading="lazy"/>`
              : `<div class="product-img-placeholder" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:var(--color-muted);"><i class="fa-solid fa-vase"></i></div>`}
            
            <!-- Offer Tag floating over image -->
            ${offerBadge}
            
            <!-- Heart Wishlist button floating over image -->
            <button class="btn-wishlist ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); if (typeof Wishlist !== 'undefined') Wishlist.toggle('${p.id}')" title="Favoritos">
              <i class="${isWish ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
          </div>
          <div class="product-card-body">
            <div class="product-card-name" style="font-weight:700; font-size: 0.95rem; line-height: 1.35; color: var(--color-text); margin-bottom: 0.15rem;">${window.translateProduct(p)}</div>
            
            ${starsHtml}
            
            <div class="product-starting-price" style="font-size: 0.82rem; color: var(--color-text); font-weight: 500; margin-bottom: 0.5rem;">
              ${startingAtText}
            </div>

            <!-- Full-width Add to Cart Button -->
            <button class="btn-add-to-cart-full ${isOutOfStock ? 'disabled' : ''} ${isOwner ? 'owner' : ''}" 
                    onclick="event.stopPropagation(); ${isOutOfStock || isOwner ? '' : `addToCart('${p.id}')`}" 
                    ${isOutOfStock || isOwner ? 'disabled' : ''}>
              ${btnText}
            </button>
          </div>
        </div>
      `;
    }).join('');

    renderPagination(meta.totalPages, page);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>${i18next.t('catalog.errorLoading')}</h3><p>${e.message}</p></div>`;
  }
}

function renderTrustBadge(status) {
  if (status === 'verified') {
    return `<i class="fa-solid fa-circle-check" style="color: var(--color-verified); font-size: 0.9rem; margin-left: 0.25rem;" title="Vendedor Verificado"></i>`;
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

let filterTimeout;
function applyFilters(debounceMs = 0) {
  clearTimeout(filterTimeout);
  
  const execute = () => {
    const regions = document.getElementById('region-select').value;
    const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value).join(',');
    const materials = Array.from(document.querySelectorAll('input[name="material"]:checked')).map(el => el.value).join(',');
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    // Sync sorting dropdown values
    const desktopSort = document.getElementById('sort-select');
    const mobileSort = document.getElementById('mobile-sort-select');
    const sortBy = desktopSort?.value || mobileSort?.value || 'newest';
    
    // Sync search input values
    const desktopSearch = document.getElementById('search-input');
    const mobileSearch = document.getElementById('mobile-search-input');
    const search = (desktopSearch?.value || mobileSearch?.value || '').trim();
    
    // Make sure we keep both inputs in sync visually if one changes
    if (desktopSearch && mobileSearch) {
      if (document.activeElement === desktopSearch) {
        mobileSearch.value = desktopSearch.value;
      } else if (document.activeElement === mobileSearch) {
        desktopSearch.value = mobileSearch.value;
      }
    }
    
    syncFiltersToUrl({ regions, categories, materials, minPrice, maxPrice, sortBy, search });
    loadProducts(1);
    
    // 🏷️ Sync chips immediately
    if (typeof syncCategoryChips === 'function') syncCategoryChips();
  };

  if (debounceMs > 0) {
    filterTimeout = setTimeout(execute, debounceMs);
  } else {
    execute();
  }
}

function clearFilters() {
  document.getElementById('region-select').value = '';
  document.querySelectorAll('input[name="category"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="material"]').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="price-range"]').forEach(el => el.checked = false);
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  
  const desktopSort = document.getElementById('sort-select');
  if (desktopSort) desktopSort.value = 'newest';
  const mobileSort = document.getElementById('mobile-sort-select');
  if (mobileSort) mobileSort.value = 'newest';
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const mobileSearch = document.getElementById('mobile-search-input');
  if (mobileSearch) mobileSearch.value = '';
  
  history.replaceState(null, '', window.location.pathname);
  loadProducts(1);
  
  // 🏷️ Sync chips immediately
  if (typeof syncCategoryChips === 'function') syncCategoryChips();
}

window.applyPriceRangeFilter = (selectedCheckbox) => {
  const checkboxes = document.querySelectorAll('input[name="price-range"]');
  checkboxes.forEach(cb => {
    if (cb !== selectedCheckbox) cb.checked = false;
  });

  const minInput = document.getElementById('min-price');
  const maxInput = document.getElementById('max-price');

  if (selectedCheckbox.checked) {
    const [min, max] = selectedCheckbox.value.split('-');
    minInput.value = min || '';
    maxInput.value = max || '';
  } else {
    minInput.value = '';
    maxInput.value = '';
  }

  applyFilters();
};

// Sync mobile and desktop sort dropdowns
window.syncMobileSort = (mobileSelect) => {
  const desktopSelect = document.getElementById('sort-select');
  if (desktopSelect) {
    desktopSelect.value = mobileSelect.value;
  }
  applyFilters();
};

// Toggle quick filter scroll/focus
window.toggleQuickFilter = (type) => {
  const sidebar = document.querySelector('.filter-sidebar');
  if (sidebar) {
    window.toggleFilterSidebar(true);
    let targetSection;
    if (type === 'region') {
      targetSection = document.getElementById('region-select');
    } else if (type === 'price') {
      targetSection = document.getElementById('min-price');
    }
    if (targetSection) {
      setTimeout(() => {
        targetSection.focus();
        targetSection.style.outline = '2px solid var(--color-primary)';
        setTimeout(() => { targetSection.style.outline = 'none'; }, 1500);
      }, 300);
    }
  }
};

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

function addToCart(productId) {
  const p = cachedProducts.find(x => x.id === productId);
  if (!p) return;
  const user = Auth.getUser();
  if (user && user.role === 'artesano' && p.artisan?.user && user.id === p.artisan.user.id) {
    showToast('No puedes comprar tus propios productos', 'warning'); 
    return;
  }
  const imgUrl = p.images && p.images[0] ? p.images[0].url : '';
  const artisanName = p.artisan?.user?.full_name || '';
  Cart.add({ id: p.id, name: p.name, price: p.price, image: imgUrl, artisanName }, 1);
}

// Dynamic Filter Sidebar drawer controls
window.toggleFilterSidebar = (isOpen) => {
  const sidebar = document.querySelector('.filter-sidebar');
  if (!sidebar) return;
  
  let backdrop = document.getElementById('filter-sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'filter-sidebar-backdrop';
    backdrop.className = 'filter-sidebar-backdrop';
    backdrop.onclick = () => window.toggleFilterSidebar(false);
    document.body.appendChild(backdrop);
  }
  
  if (isOpen) {
    sidebar.classList.add('open');
    backdrop.style.display = 'block';
    backdrop.offsetHeight; // force layout reflow
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!sidebar.classList.contains('open')) {
        backdrop.style.display = 'none';
      }
    }, 300);
  }
};
