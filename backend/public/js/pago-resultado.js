// pago-resultado.js — Resultado de Pago Dinámico con ePayco
let currentData = null;

const runInitResultado = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initResultado();
};

if (window.i18nReadyProcessed) {
  runInitResultado();
} else {
  document.addEventListener('i18nReady', runInitResultado);
}

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  if (currentData) {
    renderOutcome(currentData);
  }
});

async function initResultado() {
  const params = new URLSearchParams(window.location.search);
  const refPayco = params.get('ref_payco') || params.get('x_ref_payco');

  let data = null;

  if (refPayco) {
    try {
      const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`);
      const json = await res.json();
      if (json && json.success && json.data) {
        data = json.data;
        console.log('Verified transaction details from ePayco:', data);
      }
    } catch (e) {
      console.error('Error fetching epayco transaction validation:', e);
    }
  }

  // Fallback to URL parameters if API validation failed or ref_payco is not present
  if (!data) {
    console.log('Using query parameters fallback for payment state');
    data = {
      x_ref_payco: refPayco || params.get('x_ref_payco') || 'N/A',
      x_amount: params.get('x_amount') || '0',
      x_transaction_state: params.get('x_transaction_state') || params.get('x_response') || 'Fallida',
      x_cod_response: params.get('x_cod_response') || params.get('x_response_code'),
      x_id_invoice: params.get('x_id_invoice') || params.get('order_id') || params.get('x_invoice') || 'N/A',
      x_franchise: params.get('x_franchise') || params.get('x_type_operation') || 'N/A',
      x_bank_name: params.get('x_bank_name') || 'N/A',
      x_transaction_date: params.get('x_transaction_date') || new Date().toLocaleString(),
      x_response: params.get('x_response') || params.get('x_response_reason_text') || 'Rechazada por la pasarela de pagos'
    };
  }

  currentData = data;
  renderOutcome(data);
}

function formatCOP(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
}

function renderOutcome(data) {
  const container = document.getElementById('resultado-container');
  if (!container) return;

  const cod = data.x_cod_response;
  const state = (data.x_transaction_state || '').toLowerCase();
  
  // 1 = Aceptada, Approved = Aprobada
  const isApproved = cod === 1 || cod === '1' || state === 'aceptada' || state === 'approved';

  if (isApproved) {
    // 1. Success Flow
    document.getElementById('page-title').textContent = `${i18next.t('payment.successTitle', { defaultValue: 'Pago Exitoso — Art Huila' })}`;
    
    // Clear cart on success
    if (typeof Cart !== 'undefined') {
      Cart.clear();
    }

    container.innerHTML = `
      <div class="success-container flex flex-col items-center justify-center min-height-80vh text-center px-4 py-8 bg-gray-50 pb-20">
        <div class="success-icon text-green-600 bg-green-50 w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-green-200" style="color: #16a34a; font-size: 2.5rem; margin-bottom: 1.5rem;"><i class="fa-solid fa-circle-check"></i></div>
        <h1 class="success-title text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 font-display" style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: #261f1b; margin: 0 0 0.5rem 0;" data-i18n="payment.completedHeading">${i18next.t('payment.completedHeading', { defaultValue: '¡Pago Completado!' })}</h1>
        <p class="text-sm text-gray-500 max-w-md mb-4" style="color: var(--color-muted); font-size: 0.88rem; line-height: 1.4; max-width: 440px; margin: 0 auto 1.5rem auto;" data-i18n="payment.successDesc">
          ${i18next.t('payment.successDesc', { defaultValue: 'Gracias por apoyar a los artesanos del Huila. Tu pedido está siendo procesado. Recibirás un correo de confirmación.' })}
        </p>

        <!-- Shipment Timeline -->
        <div id="shipment-timeline" class="w-full max-w-md my-4 px-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm" style="background: white; border-radius: 20px; border: 1.2px solid #ebdcd0; padding: 1.25rem; width: 100%; max-width: 440px; box-shadow: var(--shadow-sm); box-sizing: border-box; margin-bottom: 1rem;">
          <h3 class="text-xs font-bold text-gray-800 uppercase tracking-wider text-left mb-4 flex items-center gap-1.5" style="font-family: var(--font-body); font-size: 0.8rem; font-weight: 700; color: #261f1b; margin: 0 0 1rem 0; text-align: left; text-transform: uppercase;">
            <i class="fa-solid fa-route" style="color: #C84B11;"></i> <span data-i18n="order.shippingStatusTitle">${i18next.t('order.shippingStatusTitle', { defaultValue: 'Estado del Envío' })}</span>
          </h3>
          <div class="relative flex items-center justify-between w-full px-2" style="position: relative; display: flex; justify-content: space-between; align-items: center;">
            <div class="absolute left-0 right-0 top-[16px] h-1 bg-gray-100 z-0" style="position: absolute; left: 16px; right: 16px; top: 16px; height: 3px; background: #e5e7eb; z-index: 1;"></div>
            <div id="timeline-bar" class="absolute left-0 top-[16px] h-1 bg-orange-600 z-0 transition-all duration-500" style="position: absolute; left: 16px; top: 16px; height: 3px; background: #C84B11; z-index: 2; width: 25%; transition: width 0.5s ease;"></div>
            
            <div class="step-node z-10 flex flex-col items-center" style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 20%;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center bg-orange-600 text-white text-xs font-bold shadow-sm" style="width: 32px; height: 32px; border-radius: 50%; background: #C84B11; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; box-shadow: var(--shadow-xs);">
                <i class="fa-solid fa-check"></i>
              </div>
              <span class="text-[10px] font-bold text-gray-800 mt-2" style="font-size: 0.65rem; font-weight: 700; color: #261f1b; margin-top: 0.35rem;" data-i18n="order.statusPaid">${i18next.t('order.statusPaid', { defaultValue: 'Pagado' })}</span>
            </div>
            <div class="step-node z-10 flex flex-col items-center" style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 20%;">
              <div id="step-preparing-node" class="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-orange-600 text-orange-600 text-xs font-bold shadow-sm" style="width: 32px; height: 32px; border-radius: 50%; background: white; border: 2px solid #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; box-shadow: var(--shadow-xs);">
                <i class="fa-solid fa-hammer"></i>
              </div>
              <span class="text-[10px] font-bold text-gray-800 mt-2" style="font-size: 0.65rem; font-weight: 700; color: var(--color-muted); margin-top: 0.35rem;" data-i18n="order.statusPreparing">${i18next.t('order.statusPreparing', { defaultValue: 'Preparación' })}</span>
            </div>
            <div class="step-node z-10 flex flex-col items-center" style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 20%;">
              <div id="step-shipped-node" class="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-100 text-gray-400 text-xs font-bold shadow-sm" style="width: 32px; height: 32px; border-radius: 50%; background: white; border: 2px solid #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; box-shadow: var(--shadow-xs);">
                <i class="fa-solid fa-truck"></i>
              </div>
              <span class="text-[10px] font-bold text-gray-400 mt-2" style="font-size: 0.65rem; font-weight: 700; color: var(--color-muted); margin-top: 0.35rem;" data-i18n="order.statusShipped">${i18next.t('order.statusShipped', { defaultValue: 'Despachado' })}</span>
            </div>
            <div class="step-node z-10 flex flex-col items-center" style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 20%;">
              <div id="step-delivered-node" class="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-100 text-gray-400 text-xs font-bold shadow-sm" style="width: 32px; height: 32px; border-radius: 50%; background: white; border: 2px solid #e5e7eb; color: #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; box-shadow: var(--shadow-xs);">
                <i class="fa-solid fa-house-chimney"></i>
              </div>
              <span class="text-[10px] font-bold text-gray-400 mt-2" style="font-size: 0.65rem; font-weight: 700; color: var(--color-muted); margin-top: 0.35rem;" data-i18n="order.statusDelivered">${i18next.t('order.statusDelivered', { defaultValue: 'Entregado' })}</span>
            </div>
          </div>
        </div>

        <!-- Artisan Card Section -->
        <div id="artisan-shipment-card" class="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-4 my-3 shadow-sm text-left" style="display: none; background: white; border-radius: 20px; border: 1.2px solid #ebdcd0; padding: 1.25rem; width: 100%; max-width: 440px; box-shadow: var(--shadow-sm); box-sizing: border-box; text-align: left; margin-bottom: 1rem;">
          <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0" style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 1.5px solid white; box-shadow: var(--shadow-xs); flex-shrink: 0; background: #faf8f5;">
              <img id="artisan-avatar" src="/img/placeholder-avatar.jpg" class="w-full h-full object-cover" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div class="flex-1" style="flex: 1;">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-orange-600" style="font-size: 0.65rem; font-weight: 800; color: #C84B11; text-transform: uppercase; letter-spacing: 0.05em;" data-i18n="artisan.yourArtisanLabel">${i18next.t('artisan.yourArtisanLabel', { defaultValue: 'Tu artesano a cargo' })}</div>
              <h4 id="artisan-name" class="font-bold text-gray-900 text-sm leading-tight" style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: #261f1b; margin: 0.1rem 0 0.15rem 0;">Nombre del Artesano</h4>
              <div class="text-xs text-gray-500 flex items-center gap-1 mt-0.5" style="font-size: 0.72rem; color: var(--color-muted); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                <i class="fa-solid fa-location-dot" style="color: #C84B11;"></i> <span id="artisan-location">Huila, Colombia</span>
              </div>
            </div>
            <span class="bg-green-50 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 99px; display: inline-flex; align-items: center; gap: 0.25rem; font-family: var(--font-body);">
              <span class="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> <span data-i18n="common.active">${i18next.t('common.active', { defaultValue: 'Activo' })}</span>
            </span>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1.2px solid #f2ece6; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <p class="text-xs text-gray-600 leading-normal flex-1 pr-3" style="font-size: 0.75rem; color: #4a3e35; font-weight: 500; margin: 0; line-height: 1.35; flex: 1;" data-i18n="artisan.preparingPieceMsg">
              ${i18next.t('artisan.preparingPieceMsg', { defaultValue: 'El maestro está preparando con dedicación tu pieza única para ser despachada.' })}
            </p>
            <button id="btn-msg-artisan" class="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer" style="background: #faf8f5; border: 1px solid #ebdcd0; color: #C84B11; border-radius: 99px; padding: 0.45rem 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: gap: 0.35rem; transition: all 0.2s;">
              <i class="fa-solid fa-message"></i> <span data-i18n="nav.profile">${i18next.t('nav.profile', { defaultValue: 'Perfil' })}</span>
            </button>
          </div>
        </div>

        <!-- Details Card -->
        <div class="success-card" id="order-info" style="background: white; border-radius: 20px; border: 1.2px solid #ebdcd0; padding: 1.25rem; width: 100%; max-width: 440px; box-shadow: var(--shadow-sm); box-sizing: border-box; text-align: left; margin-bottom: 1.5rem; margin-top: 0;">
          <div class="info-row">
            <span style="color:var(--color-muted);" data-i18n="payment.transactionId">${i18next.t('payment.transactionId', { defaultValue: 'ID de transacción' })}</span>
            <span id="txn-id" style="font-weight:600;">${data.x_ref_payco}</span>
          </div>
          <div class="info-row" id="row-amount">
            <span style="color:var(--color-muted);" data-i18n="payment.amountPaid">${i18next.t('payment.amountPaid', { defaultValue: 'Monto pagado' })}</span>
            <span id="txn-amount" style="font-weight:700; color:#c1440e;">${formatCOP(data.x_amount)}</span>
          </div>
          <div class="info-row" id="row-method">
            <span style="color:var(--color-muted);" data-i18n="payment.paymentMethod">${i18next.t('payment.paymentMethod', { defaultValue: 'Franquicia' })}</span>
            <span id="txn-method" style="font-weight:600;">${data.x_franchise}</span>
          </div>
          <div class="info-row" id="row-bank">
            <span style="color:var(--color-muted);">Banco</span>
            <span id="txn-bank" style="font-weight:600;">${data.x_bank_name}</span>
          </div>
          <div class="info-row" id="row-date">
            <span style="color:var(--color-muted);" data-i18n="payment.date">${i18next.t('payment.date', { defaultValue: 'Fecha' })}</span>
            <span id="txn-date" style="font-weight:600;">${data.x_transaction_date}</span>
          </div>
          <div class="info-row">
            <span style="color:var(--color-muted);" data-i18n="payment.statusLabel">${i18next.t('payment.statusLabel', { defaultValue: 'Estado' })}</span>
            <span style="color:#16a34a;font-weight:600;"><i class="fa-solid fa-check"></i> <span data-i18n="payment.approvedStatus">${i18next.t('payment.approvedStatus', { defaultValue: 'Aprobado' })}</span></span>
          </div>
        </div>

        <div class="nav-actions" style="margin-top: 0.5rem; width: 100%; max-width: 440px; display: flex; gap: 0.75rem;">
          <a href="dashboard-comprador.html" class="btn btn-primary btn-lg" style="flex: 1; border-radius: 99px; text-align: center; justify-content: center; display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem; font-size: 0.85rem; font-weight: 700; background: #c1440e; border: none; color: white;"><i class="fa-solid fa-box"></i> <span data-i18n="payment.viewOrdersBtn">${i18next.t('payment.viewOrdersBtn', { defaultValue: 'Ver mis pedidos' })}</span></a>
          <a href="catalogo.html" class="btn btn-outline btn-lg" style="flex: 1; border-radius: 99px; text-align: center; justify-content: center; display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem; font-size: 0.85rem; font-weight: 700; background: white; border: 1.5px solid #ebdcd0; color: #4a3e35;" data-i18n="payment.continueShoppingBtn">← ${i18next.t('payment.continueShoppingBtn', { defaultValue: 'Seguir comprando' })}</a>
        </div>
      </div>
    `;

    // Process order details to fill timeline and artisan profile
    if (data.x_id_invoice && data.x_id_invoice !== 'N/A') {
      loadOrderDetails(data.x_id_invoice);
    }

  } else {
    // 2. Failure/Error Flow
    document.getElementById('page-title').textContent = `${i18next.t('payment.failedTitle', { defaultValue: 'Pago Rechazado — Art Huila' })}`;
    
    container.innerHTML = `
      <div class="failed-container">
        <!-- Icono animado -->
        <div class="failed-icon-wrapper">
          <div class="failed-icon-ring"></div>
          <div class="failed-icon">
            <i class="fa-solid fa-xmark"></i>
          </div>
        </div>

        <h1 class="failed-title" data-i18n="payment.failedHeading">${i18next.t('payment.failedHeading', { defaultValue: 'Transacción Rechazada' })}</h1>
        <p class="failed-subtitle" data-i18n="payment.failedDesc">
          ${i18next.t('payment.failedDesc', { defaultValue: 'Tu pago no pudo ser procesado. Esto puede deberse a fondos insuficientes, datos incorrectos o un rechazo de tu banco. Puedes reintentar el pago.' })}
        </p>

        <!-- Details Card -->
        <div class="failed-card" id="order-info">
          <div class="info-row">
            <span class="label"><i class="fa-solid fa-hashtag"></i> <span data-i18n="payment.failedReference">${i18next.t('payment.failedReference', { defaultValue: 'Referencia' })}</span></span>
            <span id="txn-ref" class="value">${data.x_ref_payco}</span>
          </div>
          <div class="info-row">
            <span class="label"><i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i> <span data-i18n="payment.statusLabel">${i18next.t('payment.statusLabel', { defaultValue: 'Estado' })}</span></span>
            <span class="value" style="color:#ef4444; font-weight:700;">${data.x_transaction_state || i18next.t('payment.rejectedStatus', { defaultValue: 'Rechazado' })}</span>
          </div>
          <div class="info-row" id="row-amount">
            <span class="label"><i class="fa-solid fa-dollar-sign" style="color:var(--color-primary);"></i> Monto</span>
            <span id="txn-amount" class="value" style="font-weight:700; color:var(--color-primary);">${formatCOP(data.x_amount)}</span>
          </div>
          <div class="info-row" id="row-reason">
            <span class="label"><i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b;"></i> <span data-i18n="payment.failedReason">${i18next.t('payment.failedReason', { defaultValue: 'Motivo' })}</span></span>
            <span id="txn-reason" class="value" style="color:var(--color-muted);">${data.x_response}</span>
          </div>
        </div>

        <!-- Tips Card -->
        <div class="tips-card">
          <div class="tips-title"><i class="fa-solid fa-lightbulb"></i> <span data-i18n="payment.failedTipTitle">${i18next.t('payment.failedTipTitle', { defaultValue: '¿Qué puedes hacer?' })}</span></div>
          <ul class="tips-list">
            <li><i class="fa-solid fa-check-circle" style="color:#16a34a;"></i> <span data-i18n="payment.failedTip1">${i18next.t('payment.failedTip1', { defaultValue: 'Verifica que los datos de tu tarjeta sean correctos' })}</span></li>
            <li><i class="fa-solid fa-check-circle" style="color:#16a34a;"></i> <span data-i18n="payment.failedTip2">${i18next.t('payment.failedTip2', { defaultValue: 'Asegúrate de tener saldo suficiente' })}</span></li>
            <li><i class="fa-solid fa-check-circle" style="color:#16a34a;"></i> <span data-i18n="payment.failedTip3">${i18next.t('payment.failedTip3', { defaultValue: 'Intenta con otro método de pago (PSE, Nequi)' })}</span></li>
            <li><i class="fa-solid fa-check-circle" style="color:#16a34a;"></i> <span data-i18n="payment.failedTip4">${i18next.t('payment.failedTip4', { defaultValue: 'Contacta a tu banco si el problema persiste' })}</span></li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="nav-actions">
          <a href="carrito.html" class="btn btn-primary btn-lg">
            <i class="fa-solid fa-cart-shopping"></i> <span data-i18n="cart.backToCart">${i18next.t('cart.backToCart', { defaultValue: 'Volver al carrito' })}</span>
          </a>
          <a href="dashboard-comprador.html" class="btn btn-outline btn-lg">
            <i class="fa-solid fa-house"></i> <span data-i18n="payment.failedHomeBtn">${i18next.t('payment.failedHomeBtn', { defaultValue: 'Ir al Dashboard' })}</span>
          </a>
          <a href="catalogo.html" class="btn btn-ghost btn-lg" data-i18n="payment.continueShoppingBtn">
            &#8592; ${i18next.t('payment.continueShoppingBtn', { defaultValue: 'Seguir Comprando' })}
          </a>
        </div>

        <!-- Support info -->
        <p class="support-text">
          <i class="fa-solid fa-headset"></i>
          <span data-i18n="payment.failedSupport">${i18next.t('payment.failedSupport', { defaultValue: '¿Necesitas ayuda? Escríbenos a' })}</span>
          <a href="mailto:soporte@arthuila.co" style="color:var(--color-primary);">soporte@arthuila.co</a>
        </p>
      </div>
    `;
  }

  // Force a translate apply after elements are injected
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
}

async function loadOrderDetails(orderId) {
  try {
    const order = await apiFetch(`/orders/${orderId}`);
    if (!order) return;

    // Update timeline bar and nodes based on status
    const timelineBar = document.getElementById('timeline-bar');
    const stepPreparingNode = document.getElementById('step-preparing-node');
    const stepShippedNode = document.getElementById('step-shipped-node');
    const stepDeliveredNode = document.getElementById('step-delivered-node');

    if (order.status === 'paid' || order.status === 'preparing') {
      if (timelineBar) timelineBar.style.width = '50%';
      if (stepPreparingNode) {
        stepPreparingNode.style.background = '#C84B11';
        stepPreparingNode.style.borderColor = '#C84B11';
        stepPreparingNode.style.color = 'white';
      }
    } else if (order.status === 'shipped') {
      if (timelineBar) timelineBar.style.width = '75%';
      if (stepPreparingNode) {
        stepPreparingNode.style.background = '#C84B11';
        stepPreparingNode.style.borderColor = '#C84B11';
        stepPreparingNode.style.color = 'white';
      }
      if (stepShippedNode) {
        stepShippedNode.style.background = '#C84B11';
        stepShippedNode.style.borderColor = '#C84B11';
        stepShippedNode.style.color = 'white';
      }
    } else if (order.status === 'delivered') {
      if (timelineBar) timelineBar.style.width = '100%';
      if (stepPreparingNode) {
        stepPreparingNode.style.background = '#C84B11';
        stepPreparingNode.style.borderColor = '#C84B11';
        stepPreparingNode.style.color = 'white';
      }
      if (stepShippedNode) {
        stepShippedNode.style.background = '#C84B11';
        stepShippedNode.style.borderColor = '#C84B11';
        stepShippedNode.style.color = 'white';
      }
      if (stepDeliveredNode) {
        stepDeliveredNode.style.background = '#C84B11';
        stepDeliveredNode.style.borderColor = '#C84B11';
        stepDeliveredNode.style.color = 'white';
      }
    }

    // Populate Artisan Card details
    const uniqueArtisans = [];
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const artisan = item.product?.artisan;
        if (artisan && !uniqueArtisans.some(a => a.id === artisan.id)) {
          uniqueArtisans.push(artisan);
        }
      });
    }

    if (uniqueArtisans.length > 0) {
      const firstArtisan = uniqueArtisans[0];
      const nameEl = document.getElementById('artisan-name');
      const avatarEl = document.getElementById('artisan-avatar');
      const locEl = document.getElementById('artisan-location');
      const cardEl = document.getElementById('artisan-shipment-card');
      
      if (nameEl) {
        nameEl.textContent = firstArtisan.user?.full_name || 'Maestro Artesano';
        if (uniqueArtisans.length > 1) {
          nameEl.textContent += ` y ${uniqueArtisans.length - 1} más`;
        }
      }
      if (avatarEl && firstArtisan.avatar_url) {
        avatarEl.src = firstArtisan.avatar_url;
      }
      if (locEl && firstArtisan.region) {
        locEl.textContent = firstArtisan.region.name || 'Huila, Colombia';
      }
      if (cardEl) {
        cardEl.style.display = 'block';
      }

      const msgBtn = document.getElementById('btn-msg-artisan');
      if (msgBtn) {
        msgBtn.onclick = () => {
          window.location.href = `/artesano.html?id=${firstArtisan.id}`;
        };
      }
    }
  } catch (err) {
    console.error('Error loading order for success status details:', err);
  }
}
