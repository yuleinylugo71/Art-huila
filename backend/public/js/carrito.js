let coverageData = {};

function handleDepartmentChange(deptName, selectCityValue = null) {
  const citySelect = document.getElementById('destination-city');
  if (!citySelect) return;

  // Clear previous city & options
  citySelect.innerHTML = '<option value="" disabled selected>Cargando ciudades...</option>';
  citySelect.disabled = true;

  // Clear visual status of shipping cost
  window.currentDestinationCity = null;
  const badgeEl = document.getElementById('shipping-cost-badge');
  if (badgeEl) badgeEl.textContent = 'Por calcular';
  const summaryShippingEl = document.getElementById('summary-shipping');
  if (summaryShippingEl) {
    summaryShippingEl.textContent = 'Por calcular';
    summaryShippingEl.style.color = 'var(--color-muted)';
  }
  const resultDiv = document.getElementById('shipping-result');
  if (resultDiv) {
    resultDiv.innerHTML = '';
    resultDiv.style.display = 'none';
  }
  
  // Recalculate summary total without shipping
  const cart = Cart.get();
  let subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  document.getElementById('summary-total').textContent = formatPrice(subtotal);

  // Get cities of selected department
  const cities = coverageData[deptName] || [];
  if (cities.length > 0) {
    citySelect.innerHTML = '<option value="" disabled selected>Selecciona una ciudad...</option>';
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;

    // Preselect city if provided
    if (selectCityValue) {
      // Find case-insensitive match, accent-insensitive
      const normalizeString = (str) => 
        (str || '').toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
          .trim();
      
      const normalizedCityVal = normalizeString(selectCityValue);
      const matchedCity = cities.find(c => {
        const normalizedC = normalizeString(c);
        return normalizedC === normalizedCityVal || normalizedC.includes(normalizedCityVal) || normalizedCityVal.includes(normalizedC);
      });

      if (matchedCity) {
        citySelect.value = matchedCity;
        window.currentDestinationCity = matchedCity;
        calculateShipping();
      }
    }
  } else {
    citySelect.innerHTML = '<option value="" disabled selected>Sin ciudades con cobertura</option>';
    citySelect.disabled = true;
  }
}

async function loadCoverageAndInit() {
  const deptSelect = document.getElementById('shipping-department');

  // Local fallback data loaded synchronously so the dropdown is populated instantly
  coverageData = {
    'HUILA': [
      'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Palermo',
      'Rivera', 'Algeciras', 'Yaguará', 'Agrado', 'Tarqui', 'Suaza', 'Acevedo',
      'San Agustín', 'Isnos', 'Timaná', 'Nátaga', 'Tesalia'
    ],
    'TOLIMA': ['Ibagué', 'Espinal', 'Honda'],
    'CAQUETA': ['Florencia'],
    'PUTUMAYO': ['Mocoa', 'Puerto Asís'],
    'CAUCA': ['Popayán', 'Santander de Quilichao'],
    'CUNDINAMARCA': ['Bogotá', 'Soacha', 'Zipaquirá', 'Chía'],
    'VALLE DEL CAUCA': ['Cali', 'Palmira', 'Buenaventura', 'Cartago', 'Buga', 'Tuluá'],
    'RISARALDA': ['Pereira', 'Dosquebradas'],
    'CALDAS': ['Manizales'],
    'QUINDIO': ['Armenia'],
    'META': ['Villavicencio'],
    'BOYACA': ['Tunja'],
    'ANTIOQUIA': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'],
    'SANTANDER': ['Barrancabermeja', 'Bucaramanga', 'Girón', 'Floridablanca'],
    'NORTE DE SANTANDER': ['Cúcuta'],
    'ATLANTICO': ['Barranquilla', 'Soledad'],
    'BOLIVAR': ['Cartagena'],
    'MAGDALENA': ['Santa Marta'],
    'CORDOBA': ['Montería'],
    'SUCRE': ['Sincelejo'],
    'CESAR': ['Valledupar'],
    'LA GUAJIRA': ['Riohacha'],
    'AMAZONAS': ['Leticia'],
    'VAUPES': ['Mitú'],
    'GUAINIA': ['Puerto Inírida'],
    'GUAVIARE': ['San José del Guaviare'],
    'CHOCO': ['Quibdó'],
    'ARAUCA': ['Arauca'],
    'CASANARE': ['Yopal'],
    'SAN ANDRES Y PROVIDENCIA': ['San Andrés', 'Providencia'],
    'VICHADA': ['Puerto Carreño']
  };

  const populateDepartments = () => {
    if (!deptSelect) return;
    const currentVal = deptSelect.value;
    deptSelect.innerHTML = '<option value="" disabled selected>Selecciona un departamento...</option>';
    const depts = Object.keys(coverageData).sort();
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
      deptSelect.appendChild(opt);
    });
    if (currentVal && Object.keys(coverageData).includes(currentVal)) {
      deptSelect.value = currentVal;
    }
  };

  // Populate immediately with local data
  populateDepartments();

  // Set change listener
  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      handleDepartmentChange(e.target.value);
    });
  }

  // Set city change listener
  const citySelect = document.getElementById('destination-city');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      const selectedCity = e.target.value;
      window.currentDestinationCity = selectedCity;
      calculateShipping();
    });
  }

  // Load profile and prefill in parallel/background
  const loadProfileAndPrefill = async () => {
    if (Auth.getToken()) {
      const testPanel = document.getElementById('epayco-test-panel');
      if (testPanel) testPanel.style.display = 'block';

      try {
        const freshUser = await apiFetch('/users/me');
        if (freshUser) {
          localStorage.setItem('art_huila_user', JSON.stringify(freshUser));
          prefillShippingDetails(freshUser);
        }
      } catch (err) {
        console.error('Failed to pre-fill from profile:', err);
        const cachedUser = Auth.getUser();
        if (cachedUser) prefillShippingDetails(cachedUser);
      }
    } else {
      if (Cart.get().length > 0 && window.currentDestinationCity) {
        calculateShipping();
      }
    }
  };

  loadProfileAndPrefill();

  // Try to load dynamic coverage from backend asynchronously
  try {
    const data = await apiFetch('/orders/shipping-coverage');
    if (data && Object.keys(data).length > 0) {
      coverageData = data;
      populateDepartments();
      
      // Re-trigger prefill if user is logged in to ensure correct department/city sync
      const user = Auth.getUser();
      if (user && user.department) {
        const normalizeString = (str) => 
          (str || '').toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();

        const normalizedUserDept = normalizeString(user.department);
        const matchedDept = Object.keys(coverageData).find(k => {
          const normalizedKey = normalizeString(k);
          return normalizedKey === normalizedUserDept || normalizedKey.includes(normalizedUserDept) || normalizedUserDept.includes(normalizedKey);
        });

        if (matchedDept && deptSelect) {
          deptSelect.value = matchedDept;
          handleDepartmentChange(matchedDept, user.city);
        }
      }
    }
  } catch (err) {
    console.error('Error loading shipping coverage from backend:', err);
  }
}

const initCart = () => {
  const params = new URLSearchParams(window.location.search);

  // ePayco redirect: evaluar el resultado de la transacción
  const hasEpaycoParams = params.has('ref_payco') || params.has('x_ref_payco') || params.has('x_response_code') || params.get('pago_exitoso') === 'true';

  if (hasEpaycoParams) {
    // x_response_code=1 ó x_cod_response=1 → APROBADO
    // Cualquier otro valor (2=Rechazado, 3=Pendiente, 4=Fallido) → FALLIDO
    const responseCode = params.get('x_response_code') || params.get('x_cod_response');
    const isApproved = responseCode === '1' || params.get('pago_exitoso') === 'true';

    if (isApproved) {
      Cart.clear();
      window.location.href = '/pago-exitoso.html' + window.location.search;
    } else {
      // NO limpiar el carrito — el usuario puede reintentar
      window.location.href = '/pago-fallido.html' + window.location.search;
    }
    return;
  }

  renderCart();
  document.getElementById('btn-checkout')?.addEventListener('click', proceedToCheckout);

  loadCoverageAndInit();
};

if (window.i18nReadyProcessed) {
  initCart();
} else {
  document.addEventListener('i18nReady', initCart);
}

document.addEventListener('languageChanged', () => {
  renderCart();
});

function renderCart() {
  const cart = Cart.get();
  const container = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('cart-empty');
  const contentView = document.getElementById('cart-content');

  if (!container || !emptyView || !contentView) return;

  if (cart.length === 0) {
    emptyView.style.display = 'block';
    contentView.style.display = 'none';
    return;
  }

  emptyView.style.display = 'none';
  contentView.style.display = 'grid';
  container.innerHTML = '';

  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const imgUrl = item.image ? normalizeImage(item.image) : '/img/placeholder.jpg';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${imgUrl}" alt="${window.translateProduct(item)}" onerror="this.onerror=null; this.src='/img/placeholder.jpg';" />
      <div class="cart-item-details">
        <h4 class="cart-item-name">${window.translateProduct(item)}</h4>
        <p style="font-size: 0.85rem; color: var(--color-muted);">${i18next.t('cart.artisanNameLabel')}${item.artisanName || 'N/A'}</p>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-actions">
        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
        <span style="width: 20px; text-align: center;">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
      </div>
      <div style="margin-left: 1rem;">
        <button class="btn-remove" onclick="removeFromCart(${index})" title="${i18next.t('common.delete')}">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('summary-subtotal').textContent = formatPrice(total);
  document.getElementById('summary-total').textContent = formatPrice(total + (window.currentShippingCost || 0));
}

window.updateQuantity = function(index, delta) {
  const cart = Cart.get();
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    Cart.save(cart);
    renderCart();
  }
};

window.removeFromCart = function(index) {
  const cart = Cart.get();
  cart.splice(index, 1);
  Cart.save(cart);
  renderCart();
};

function normalizeImage(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = API.replace('/api/v1', '');
  return baseUrl + (url.startsWith('/') ? '' : '/') + url;
}

// ─── CÁLCULO DE ENVÍO ────────────────────────────────────────────────────────

window.calculateShipping = async function() {
  const citySelect = document.getElementById('destination-city');
  const city = citySelect?.value;
  if (!city) {
    const summaryShipping = document.getElementById('summary-shipping');
    if (summaryShipping) {
      summaryShipping.textContent = 'Por calcular';
      summaryShipping.style.color = '';
    }
    return;
  }

  const cart = Cart.get();
  if (cart.length === 0) return;

  const btn = document.getElementById('btn-quote-shipping');
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + i18next.t('cart.calculatingShipping');
  }

  try {
    const payload = {
      destinationCity: city,
      items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
    };

    const quote = await apiFetch('/orders/shipping-quote', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Seleccionar la opción más barata por defecto
    window.currentShippingCost = quote.cost;
    window.currentDestinationCity = city;
    window.currentShippingCarrier = quote.carrier;

    renderShippingOptions(quote.options || [], city, quote.cost);

    const summaryShipping = document.getElementById('summary-shipping');
    if (summaryShipping) {
      summaryShipping.textContent = formatPrice(quote.cost);
      summaryShipping.style.color = '';
    }
    renderCart();

    // Reveal address section
    const addressSection = document.getElementById('address-section');
    if (addressSection) {
      addressSection.style.display = 'block';
      addressSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  } catch (error) {
    console.error('Error calculating shipping', error);
    showToast(i18next.t('cart.errorCalculatingShipping') + ': ' + (error.message || 'Intenta de nuevo'), 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
};

// ─── RENDER DE OPCIONES DE TRANSPORTADORA ────────────────────────────────────

function renderShippingOptions(options, city, selectedCost) {
  const resultDiv = document.getElementById('shipping-result');
  resultDiv.style.display = 'block';

  const cityDisplay = city === 'Neiva' ? 'Neiva (local)' : city;

  const carrierIcons = {
    'Servientrega': '🟡',
    'Coordinadora': '🔵',
    'TCC': '🟠',
    'Envia': '🟢',
    'Envía': '🟢',
  };

  let html = `
    <div style="margin-top:0.5rem;">
      <div style="font-size:0.78rem; color:var(--color-muted); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.3rem;">
        <i class="fa-solid fa-route"></i>&nbsp;Neiva → <strong style="color:var(--color-text);">${cityDisplay}</strong>&nbsp;· ${i18next.t('cart.chooseCarrierLabel', { defaultValue: 'Elige tu transportadora:' })}
      </div>
      <div style="display:flex; flex-direction:column; gap:0.4rem;" id="carrier-options-list">`;

  options.forEach((opt, idx) => {
    const isSelected = opt.price === selectedCost;
    const icon = carrierIcons[opt.carrier] || '📦';
    html += `
      <label class="carrier-option${isSelected ? ' selected' : ''}" onclick="selectCarrier(${idx})" style="
        display:flex; justify-content:space-between; align-items:center;
        padding:0.6rem 0.75rem; border-radius:8px; cursor:pointer;
        border:2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};
        background:${isSelected ? 'rgba(var(--color-primary-rgb,139,90,43),0.07)' : 'var(--color-bg)'};
        transition: all 0.18s; margin:0;
      ">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <input type="radio" name="carrier" value="${idx}" ${isSelected ? 'checked' : ''}
            style="accent-color:var(--color-primary); width:15px; height:15px; cursor:pointer;">
          <span style="font-size:1rem;">${icon}</span>
          <div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--color-text);">${opt.carrier}</div>
            <div style="font-size:0.75rem; color:var(--color-muted);">
              <i class="fa-regular fa-clock"></i> ${opt.estimatedDays}${i18next.t('cart.businessDays')}
            </div>
          </div>
        </div>
        <span style="font-weight:800; color:${isSelected ? 'var(--color-primary)' : 'var(--color-text)'}; font-size:0.95rem; white-space:nowrap;">
          ${formatPrice(opt.price)}
        </span>
      </label>`;
  });

  html += `</div></div>`;
  resultDiv.innerHTML = html;

  // Guardar opciones globalmente para acceso desde selectCarrier()
  window._shippingOptions = options;
}

// ─── SELECCIÓN DE TRANSPORTADORA ─────────────────────────────────────────────

window.selectCarrier = function(idx) {
  const options = window._shippingOptions;
  if (!options || !options[idx]) return;

  const opt = options[idx];
  window.currentShippingCost = opt.price;
  window.currentShippingCarrier = opt.carrier;

  // Actualizar estilos de cada tarjeta
  const labels = document.querySelectorAll('.carrier-option');
  labels.forEach((label, i) => {
    const isSelected = i === idx;
    label.style.borderColor = isSelected ? 'var(--color-primary)' : 'var(--color-border)';
    label.style.background = isSelected
      ? 'rgba(var(--color-primary-rgb,139,90,43),0.07)'
      : 'var(--color-bg)';

    const priceSpan = label.querySelector('span[style*="font-weight:800"]');
    if (priceSpan) priceSpan.style.color = isSelected ? 'var(--color-primary)' : 'var(--color-text)';

    const radio = label.querySelector('input[type=radio]');
    if (radio) radio.checked = isSelected;
  });

  // Actualizar fila de envío y total
  document.getElementById('summary-shipping').textContent = formatPrice(opt.price);
  document.getElementById('summary-shipping').style.color = '';
  renderCart();

  showToast(`<i class="fa-solid fa-check-circle"></i> ${opt.carrier} ${i18next.t('common.selected', { defaultValue: 'seleccionado' })}`, 'success');
};


// ─── CHECKOUT ────────────────────────────────────────────────────────────────

async function proceedToCheckout() {
  const token = Auth.getToken();
  if (!token) {
    showToast(i18next.t('cart.errorMustLogin'), 'warning');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }

  const cart = Cart.get();
  if (cart.length === 0) return;

  // Read shipping fields
  const name = document.getElementById('shipping-name')?.value.trim();
  const phone = document.getElementById('shipping-phone')?.value.trim();
  const department = document.getElementById('shipping-department')?.value;
  const city = document.getElementById('destination-city')?.value;
  const streetInput = document.getElementById('shipping-street');
  const street = streetInput ? streetInput.value.trim() : '';

  // Strict validation (Problem 8)
  if (!name || name.length < 3) {
    showToast('Por favor ingresa un nombre completo válido (mínimo 3 caracteres).', 'warning');
    toggleShippingEdit(true);
    document.getElementById('shipping-name')?.focus();
    return;
  }
  if (!phone || phone.length < 7) {
    showToast('Por favor ingresa un número de teléfono de contacto válido.', 'warning');
    toggleShippingEdit(true);
    document.getElementById('shipping-phone')?.focus();
    return;
  }
  if (!department) {
    showToast('Por favor selecciona el departamento de destino.', 'warning');
    toggleShippingEdit(true);
    document.getElementById('shipping-department')?.focus();
    return;
  }
  if (!city) {
    showToast('Por favor selecciona la ciudad o municipio de destino.', 'warning');
    toggleShippingEdit(true);
    document.getElementById('destination-city')?.focus();
    return;
  }
  if (!street || street.length < 5) {
    showToast('Por favor ingresa una dirección de entrega válida.', 'warning');
    toggleShippingEdit(true);
    if (streetInput) streetInput.focus();
    return;
  }

  // Auto-save changes dynamically (Problem 2)
  const currentUser = Auth.getUser() || {};
  const hasChanges = currentUser.full_name !== name || 
                     currentUser.phone !== phone || 
                     currentUser.department !== department || 
                     currentUser.city !== city || 
                     currentUser.address !== street;
                     
  if (hasChanges) {
    try {
      const updatedUser = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: name,
          phone,
          address: street,
          city,
          department
        })
      });
      localStorage.setItem('art_huila_user', JSON.stringify(updatedUser));
      updateShippingPreviewText(updatedUser);
    } catch (e) {
      console.warn('Failed to auto-save profile details:', e);
    }
  }

  window.currentDestinationCity = city;
  window.currentShippingAddress = street;

  const btn = document.getElementById('btn-checkout');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando orden...';

  const payload = {
    items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
    shipping_address: { city: window.currentDestinationCity, address: street },
    payment_method: 'EPAYCO'
  };

  try {
    const order = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    btn.disabled = false;
    btn.innerHTML = originalText;

    // Show simulated payment modal (bypasses ePayco for test mode)
    showSimulatedPaymentModal(order);

  } catch (e) {
    console.error('Checkout error:', e);
    showToast(i18next.t('cart.errorOrderProcess') + (Array.isArray(e.message) ? e.message.join(', ') : e.message), 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ─── SIMULATED PAYMENT MODAL ──────────────────────────────────────────────────

function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function showSimulatedPaymentModal(order) {
  // Remove existing modal if any
  document.getElementById('sim-pay-modal')?.remove();

  const total = formatCOP(order.total_amount);
  const subtotal = formatCOP(Number(order.total_amount) - Number(order.shipping_cost || 0));
  const shipping = formatCOP(order.shipping_cost || 0);

  const modal = document.createElement('div');
  modal.id = 'sim-pay-modal';
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.72); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:1rem;
    backdrop-filter: blur(4px); animation: fadeIn 0.25s ease;
  `;

  modal.innerHTML = `
    <style>
      @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      #sim-pay-box { animation: slideUp 0.3s ease; }
      .sim-card-chip { background: linear-gradient(135deg,#d4af37,#f5e17a,#b8860b); width:36px; height:28px; border-radius:5px; }
      .sim-input { width:100%; padding:0.6rem 0.75rem; border:1.5px solid #d1d5db; border-radius:8px; font-size:0.9rem; background:#fff; color:#111; box-sizing:border-box; transition:border-color 0.2s; outline:none; }
      .sim-input:focus { border-color:#8b5a2b; }
      .sim-btn-approve { background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border:none; padding:0.85rem 1.5rem; border-radius:10px; font-size:1rem; font-weight:700; cursor:pointer; width:100%; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
      .sim-btn-approve:hover { background:linear-gradient(135deg,#15803d,#166534); transform:translateY(-1px); box-shadow:0 4px 16px rgba(22,163,74,0.4); }
      .sim-btn-cancel { background:transparent; color:#6b7280; border:1.5px solid #d1d5db; padding:0.6rem 1.2rem; border-radius:8px; font-size:0.88rem; cursor:pointer; transition:all 0.2s; }
      .sim-btn-cancel:hover { border-color:#9ca3af; color:#374151; }
      .test-card-badge { display:inline-flex; align-items:center; gap:0.35rem; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; padding:0.3rem 0.65rem; border-radius:20px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
      .test-card-badge:hover { background:#dbeafe; }
    </style>

    <div id="sim-pay-box" style="background:#fff; border-radius:20px; width:100%; max-width:480px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.35);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e); padding:1.5rem 2rem; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="color:#93c5fd; font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.2rem;">Pasarela de Pago Seguro</div>
          <div style="color:#fff; font-size:1.3rem; font-weight:800; font-family:'Crimson Pro',serif;">Art Huila</div>
        </div>
        <div style="text-align:right;">
          <div style="color:#93c5fd; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em;">Total a pagar</div>
          <div style="color:#fff; font-size:1.6rem; font-weight:900;">${total}</div>
        </div>
      </div>

      <!-- Test mode notice -->
      <div style="background:#fef9c3; border-bottom:1px solid #fde68a; padding:0.6rem 1.5rem; display:flex; align-items:center; gap:0.5rem;">
        <i class="fa-solid fa-flask" style="color:#b45309; font-size:0.85rem;"></i>
        <span style="font-size:0.78rem; color:#92400e; font-weight:600;">Modo Prueba — Usa los datos de prueba para simular el pago</span>
      </div>

      <!-- Body -->
      <div style="padding:1.5rem 2rem;">
        <!-- Order summary -->
        <div style="background:#f9fafb; border-radius:10px; padding:0.9rem 1rem; margin-bottom:1.25rem; border:1px solid #e5e7eb;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#6b7280; margin-bottom:0.4rem;">
            <span>Subtotal</span><span>${subtotal}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#6b7280; margin-bottom:0.4rem;">
            <span>Envío (${order.shipping_company || 'Transportadora'})</span><span>${shipping}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:1rem; font-weight:800; color:#111; border-top:1px solid #e5e7eb; padding-top:0.5rem; margin-top:0.4rem;">
            <span>Total</span><span style="color:#8b5a2b;">${total}</span>
          </div>
        </div>

        <!-- Card form -->
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-size:0.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">Número de tarjeta</label>
          <div style="position:relative;">
            <input id="sim-card-num" class="sim-input" type="text" maxlength="19" placeholder="0000 0000 0000 0000" value="4575 2362 5326 0168" />
            <i class="fa-brands fa-cc-visa" style="position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); color:#1a56db; font-size:1.3rem;"></i>
          </div>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            <span class="test-card-badge" onclick="document.getElementById('sim-card-num').value='4575 2362 5326 0168'; updateCardIcon(this)">
              <i class="fa-brands fa-cc-visa"></i> Visa
            </span>
            <span class="test-card-badge" onclick="document.getElementById('sim-card-num').value='5170 6952 0831 6840'; updateCardIcon(this)">
              <i class="fa-brands fa-cc-mastercard"></i> MasterCard
            </span>
            <span class="test-card-badge" onclick="document.getElementById('sim-card-num').value='3757 5217 5049 510'; updateCardIcon(this)">
              <i class="fa-brands fa-cc-amex"></i> Amex
            </span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
          <div style="grid-column:span 2;">
            <label style="display:block; font-size:0.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">Nombre en la tarjeta</label>
            <input id="sim-card-name" class="sim-input" type="text" placeholder="NOMBRE APELLIDO" value="COMPRADOR PRUEBA" />
          </div>
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">Venc.</label>
            <input id="sim-card-exp" class="sim-input" type="text" maxlength="5" placeholder="MM/AA" value="12/26" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">CVV</label>
            <input id="sim-card-cvv" class="sim-input" type="text" maxlength="4" placeholder="123" value="123" />
          </div>
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">Cuotas</label>
            <select id="sim-card-cuotas" class="sim-input">
              <option value="1" selected>1 cuota</option>
              <option value="3">3 cuotas</option>
              <option value="6">6 cuotas</option>
              <option value="12">12 cuotas</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <button id="sim-btn-pay" class="sim-btn-approve" onclick="simulatePayment('${order.id}', '${order.total_amount}')">
          <i class="fa-solid fa-lock"></i> Pagar ${total}
        </button>
        <div style="display:flex; justify-content:center; margin-top:0.75rem;">
          <button class="sim-btn-cancel" onclick="document.getElementById('sim-pay-modal').remove()">
            Cancelar y volver al carrito
          </button>
        </div>

        <div style="display:flex; align-items:center; justify-content:center; gap:0.4rem; margin-top:1rem; color:#9ca3af; font-size:0.72rem;">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Pago simulado en modo prueba — No se cobra dinero real</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

window.updateCardIcon = function(el) {
  // Update card brand icon based on selection
  const iconEl = document.querySelector('#sim-pay-modal .fa-cc-visa, #sim-pay-modal .fa-cc-mastercard, #sim-pay-modal .fa-cc-amex, #sim-pay-modal .fa-cc-diners-club');
  if (!iconEl) return;
  const text = el.textContent.toLowerCase();
  if (text.includes('visa')) { iconEl.className = 'fa-brands fa-cc-visa'; iconEl.style.color = '#1a56db'; }
  else if (text.includes('master')) { iconEl.className = 'fa-brands fa-cc-mastercard'; iconEl.style.color = '#eb5226'; }
  else if (text.includes('amex')) { iconEl.className = 'fa-brands fa-cc-amex'; iconEl.style.color = '#2e77bc'; }
};

window.simulatePayment = async function(orderId, totalAmount) {
  const btn = document.getElementById('sim-btn-pay');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando pago...';
  }

  try {
    // Call backend to mark order as paid
    await apiFetch(`/orders/${orderId}/pay`, { method: 'POST' });

    // Clear cart
    Cart.clear();

    // Close modal
    document.getElementById('sim-pay-modal')?.remove();

    // Redirect to success page with simulated params
    const cardNum = document.getElementById('sim-card-num')?.value || '4575 2362 5326 0168';
    const last4 = cardNum.replace(/\s/g, '').slice(-4);
    const params = new URLSearchParams({
      x_ref_payco: `SIM_${orderId.substring(0, 8).toUpperCase()}`,
      x_amount: totalAmount,
      x_franchise: `VISA-${last4}`,
      x_transaction_date: new Date().toLocaleString('es-CO'),
      simulated: 'true'
    });
    window.location.href = `/pago-exitoso.html?${params.toString()}`;

  } catch (e) {
    console.error('Payment simulation error:', e);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-lock"></i> Pagar`;
    }
    showToast('<i class="fa-solid fa-circle-xmark"></i> Error al procesar el pago: ' + (e.message || 'Intenta de nuevo'), 'error');
  }
};

function prefillShippingDetails(user) {
  if (document.getElementById('shipping-name')) {
    document.getElementById('shipping-name').value = user.full_name || '';
  }
  if (document.getElementById('shipping-phone')) {
    document.getElementById('shipping-phone').value = user.phone || '';
  }
  if (document.getElementById('shipping-street')) {
    document.getElementById('shipping-street').value = user.address || '';
  }

  // Pre-fill department and city dropdowns
  const deptSelect = document.getElementById('shipping-department');
  if (deptSelect && user.department) {
    const normalizeString = (str) => 
      (str || '').toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const normalizedUserDept = normalizeString(user.department);
    const matchedDept = Object.keys(coverageData).find(k => {
      const normalizedKey = normalizeString(k);
      return normalizedKey === normalizedUserDept || normalizedKey.includes(normalizedUserDept) || normalizedUserDept.includes(normalizedKey);
    });

    if (matchedDept) {
      deptSelect.value = matchedDept;
      handleDepartmentChange(matchedDept, user.city);
    }
  }

  // Update preview
  updateShippingPreviewText(user);

  // Collapse if user has complete details, otherwise keep open
  const hasDetails = user.full_name && user.phone && user.address && user.city && user.department;
  if (hasDetails) {
    toggleShippingEdit(false);
  } else {
    toggleShippingEdit(true);
  }
  
  // Show edit button
  const editBtn = document.getElementById('btn-edit-shipping');
  if (editBtn) editBtn.style.display = 'inline-block';
}

function updateShippingPreviewText(user) {
  if (document.getElementById('shipping-preview-name')) {
    document.getElementById('shipping-preview-name').textContent = user.full_name || '—';
  }
  if (document.getElementById('shipping-preview-phone')) {
    document.getElementById('shipping-preview-phone').textContent = user.phone || '—';
  }
  if (document.getElementById('shipping-preview-address')) {
    document.getElementById('shipping-preview-address').textContent = user.address || '—';
  }
  if (document.getElementById('shipping-preview-city')) {
    document.getElementById('shipping-preview-city').textContent = user.city || '—';
  }
  if (document.getElementById('shipping-preview-dept')) {
    document.getElementById('shipping-preview-dept').textContent = user.department || '—';
  }
}

window.toggleShippingEdit = function(isEdit) {
  const preview = document.getElementById('shipping-summary-preview');
  const editFields = document.getElementById('shipping-edit-fields');
  const saveBtn = document.getElementById('btn-save-shipping');
  const editBtn = document.getElementById('btn-edit-shipping');

  if (isEdit) {
    if (preview) preview.style.display = 'none';
    if (editFields) editFields.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (editBtn) editBtn.style.display = 'none';
  } else {
    if (preview) preview.style.display = 'block';
    if (editFields) editFields.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
  }
};

window.saveShippingDetailsInline = async function() {
  const name = document.getElementById('shipping-name')?.value.trim();
  const phone = document.getElementById('shipping-phone')?.value.trim();
  const address = document.getElementById('shipping-street')?.value.trim();
  const city = document.getElementById('destination-city')?.value;
  const department = document.getElementById('shipping-department')?.value;

  if (!name || name.length < 3) {
    showToast('Por favor ingresa un nombre completo válido (mínimo 3 caracteres).', 'warning');
    document.getElementById('shipping-name')?.focus();
    return;
  }
  if (!phone || phone.length < 7) {
    showToast('Por favor ingresa un número de teléfono de contacto válido.', 'warning');
    document.getElementById('shipping-phone')?.focus();
    return;
  }
  if (!department) {
    showToast('Por favor selecciona el departamento de destino.', 'warning');
    document.getElementById('shipping-department')?.focus();
    return;
  }
  if (!city) {
    showToast('Por favor selecciona la ciudad o municipio de destino.', 'warning');
    document.getElementById('destination-city')?.focus();
    return;
  }
  if (!address || address.length < 5) {
    showToast('Por favor ingresa una dirección de entrega válida.', 'warning');
    document.getElementById('shipping-street')?.focus();
    return;
  }

  const saveBtn = document.getElementById('btn-save-shipping');
  const originalText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
  }

  try {
    const updatedUser = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        full_name: name,
        phone,
        address,
        city,
        department
      })
    });

    localStorage.setItem('art_huila_user', JSON.stringify(updatedUser));
    
    // Update preview UI
    updateShippingPreviewText(updatedUser);
    window.currentDestinationCity = city;
    window.currentShippingAddress = address;

    // Calculate shipping for new city
    await calculateShipping();

    // Hide editor
    toggleShippingEdit(false);
    showToast('Datos de envío actualizados correctamente.', 'success');
  } catch (err) {
    showToast('Error al actualizar datos de envío: ' + err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
};

window.copyCardNumber = function(number) {
  navigator.clipboard.writeText(number).then(() => {
    showToast('Número de tarjeta copiado: ' + number, 'success');
  }).catch(err => {
    console.error('Error copying text: ', err);
  });
};

