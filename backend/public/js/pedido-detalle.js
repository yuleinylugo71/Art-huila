if (!Auth.getToken()) window.location.href = '/login.html';

let currentOrderId = null;

if (window.i18nReadyProcessed) {
    initPage();
} else {
    document.addEventListener('i18nReady', initPage);
}

document.addEventListener('languageChanged', () => {
    if (currentOrderId) {
        loadOrderDetail(currentOrderId);
    }
});

function initPage() {
    const params = new URLSearchParams(window.location.search);
    currentOrderId = params.get('id');
    const user = Auth.getUser();
    const defaultDashboard = (user && user.role === 'artesano') ? '/dashboard-artesano.html?section=mis-compras' : '/dashboard-comprador.html';

    // Dynamically adjust any back button to point to the correct dashboard
    document.querySelectorAll('a[href="/dashboard-comprador.html"], a[href="dashboard-comprador.html"]').forEach(a => {
        a.setAttribute('href', defaultDashboard);
    });

    if (!currentOrderId) {
        window.location.href = defaultDashboard;
        return;
    }
    loadOrderDetail(currentOrderId);
}

async function loadOrderDetail(orderId) {
    const orderTitle = document.getElementById('order-title');
    const orderDateText = document.getElementById('order-date-text');
    const itemsList = document.getElementById('order-items-list');
    
    try {
        const order = await apiFetch(`/orders/${orderId}`);
        if (!order) {
            showToast(i18next.t('order.errorNotFound'), 'error');
            const user = Auth.getUser();
            const defaultDashboard = (user && user.role === 'artesano') ? '/dashboard-artesano.html?section=mis-compras' : '/dashboard-comprador.html';
            setTimeout(() => { window.location.href = defaultDashboard; }, 2000);
            return;
        }

        // Title and Date
        orderTitle.textContent = i18next.t('order.idLabel', { id: order.id.substring(0, 8) });
        
        const dateLocale = i18next.language === 'es' ? 'es-CO' : 'en-US';
        const formattedDate = new Date(order.created_at).toLocaleString(dateLocale, { dateStyle: 'long', timeStyle: 'short' });
        orderDateText.textContent = i18next.t('order.placedOnLabel', { date: formattedDate });

        // Progress Tracker
        updateTracker(order.status);

        // Render Items
        let subtotal = 0;
        itemsList.innerHTML = order.items.map(item => {
            const itemSubtotal = Number(item.unit_price) * item.quantity;
            subtotal += itemSubtotal;
            const imgUrl = getImageUrl(item.product?.images?.[0]?.url);
            
            return `
                <div class="detail-item-card">
                    <img src="${imgUrl}" alt="${item.product?.name || i18next.t('order.productDeleted')}" class="detail-item-img"/>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">${item.product?.name || i18next.t('order.productDeleted')}</h4>
                        <p style="margin: 0.15rem 0 0 0; font-size: 0.8rem; color: var(--color-muted);">${i18next.t('order.artisanLabel')}${item.product?.artisan?.user?.full_name || 'Art Huila Co'}</p>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; font-weight: 500;">
                            $${Number(item.unit_price).toLocaleString('es-CO')} x ${item.quantity}
                        </p>
                    </div>
                    <div style="font-weight: 700; color: var(--color-text); font-size: 1rem;">
                        $${itemSubtotal.toLocaleString('es-CO')}
                    </div>
                </div>
            `;
        }).join('');

        // Billing Summary
        document.getElementById('bill-subtotal').textContent = `$${subtotal.toLocaleString('es-CO')}`;
        document.getElementById('bill-shipping').textContent = `$${Number(order.shipping_cost || 0).toLocaleString('es-CO')}`;
        document.getElementById('bill-total').textContent = `$${Number(order.total_amount).toLocaleString('es-CO')}`;

        // Payment Status
        const paymentStatusEl = document.getElementById('detail-payment-status');
        if (paymentStatusEl) {
            const payStatus = order.payment_status || 'pending';
            paymentStatusEl.className = `badge ${getPaymentStatusBadgeClass(payStatus)}`;
            paymentStatusEl.textContent = translatePaymentStatus(payStatus);
        }

        // Retry Payment Button Logic
        const retryContainer = document.getElementById('retry-payment-container');
        if (retryContainer) {
            const payStatus = order.payment_status || 'pending';
            if (order.status === 'pending' && (payStatus === 'rejected' || payStatus === 'failed')) {
                retryContainer.style.display = 'block';
                const retryBtn = document.getElementById('btn-retry-payment');
                if (retryBtn) {
                    const newBtn = retryBtn.cloneNode(true);
                    retryBtn.parentNode.replaceChild(newBtn, retryBtn);
                    newBtn.addEventListener('click', () => initiateEpaycoRetry(order));
                }
            } else {
                retryContainer.style.display = 'none';
            }
        }

        // Tracking Info
        const badgeContainer = document.getElementById('detail-status-badge');
        badgeContainer.innerHTML = `<span class="badge ${getStatusBadgeClass(order.status)}">${translateStatus(order.status)}</span>`;

        const carrierEl = document.getElementById('detail-carrier');
        const trackingNumEl = document.getElementById('detail-tracking-number');
        const actionContainer = document.getElementById('tracking-action-container');

        if (order.shipping_company) {
            carrierEl.textContent = order.shipping_company;
        } else {
            carrierEl.textContent = '—';
        }

        if (order.tracking_number) {
            trackingNumEl.textContent = order.tracking_number;
            const trackingUrl = getTrackingUrl(order.shipping_company, order.tracking_number);
            actionContainer.innerHTML = `
                <a href="${trackingUrl}" target="_blank" class="btn btn-primary btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
                    <i class="fa-solid fa-magnifying-glass"></i> <span>${i18next.t('order.trackShippingBtn')}</span>
                </a>
            `;
        } else {
            trackingNumEl.textContent = '—';
            actionContainer.innerHTML = `
                <div style="font-size: 0.85rem; color: var(--color-muted); text-align: center; font-style: italic; border: 1.5px dashed var(--color-border); padding: 0.75rem; border-radius: var(--radius);">
                    ${i18next.t('order.trackingUnavailableHint')}
                </div>
            `;
        }

        // Shipping Address
        const addressName = document.getElementById('address-name');
        const addressLine = document.getElementById('address-line');
        const addressCity = document.getElementById('address-city');

        const addr = order.shipping_address;
        if (addr && (addr.address || addr.city)) {
            addressName.textContent = addr.receiver_name || order.user?.full_name || Auth.getUser()?.full_name || '—';
            addressLine.textContent = addr.address || i18next.t('order.errorAddressNotRegistered');
            addressCity.textContent = addr.city ? `${addr.city}, Huila, Colombia${addr.phone ? ' · Tel: ' + addr.phone : ''}` : '—';
        } else {
            document.getElementById('shipping-address-panel').innerHTML = `
                <div style="font-size: 0.9rem; color: var(--color-danger); font-weight: 600; padding: 0.5rem; background: #fef2f2; border-radius: 4px; border: 1px solid #fecaca; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i class="fa-solid fa-triangle-exclamation"></i> <span>${i18next.t('order.errorAddressNotRegistered')}</span>
                </div>
            `;
        }


    } catch (e) {
        console.error(e);
        itemsList.innerHTML = `<div class="error-msg">${i18next.t('order.errorLoadingDetail')}${e.message}</div>`;
    }
}

function updateTracker(status) {
    const steps = ['pending', 'paid', 'preparing', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(status);
    
    // Reset classes and restore original labels
    steps.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if (el) {
            el.className = 'step';
            const labelEl = el.querySelector('.step-label');
            if (labelEl) {
                // Restore label text content based on translation
                const transKey = 'order.status' + s.charAt(0).toUpperCase() + s.slice(1);
                labelEl.textContent = i18next.t(transKey);
                labelEl.style.color = '';
            }
            const iconContainer = el.querySelector('.step-icon');
            if (iconContainer) {
                // Restore original icon HTML
                const iconMap = {
                    'pending': '<i class="fa-solid fa-hourglass-half"></i>',
                    'paid': '<i class="fa-solid fa-credit-card"></i>',
                    'preparing': '<i class="fa-solid fa-user"></i>‍<i class="fa-solid fa-utensils"></i>',
                    'shipped': '<i class="fa-solid fa-rocket"></i>',
                    'delivered': '<i class="fa-solid fa-check"></i>'
                };
                iconContainer.innerHTML = iconMap[s];
            }
        }
    });

    const lineProgress = document.getElementById('tracker-line-progress');
    
    if (status === 'cancelled') {
        // Highlight first step as danger, but show it cancelled
        const firstStep = document.getElementById('step-pending');
        if (firstStep) {
            firstStep.classList.add('active');
            firstStep.classList.add('cancelled');
            const iconEl = firstStep.querySelector('.step-icon');
            if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            const labelEl = firstStep.querySelector('.step-label');
            if (labelEl) {
                labelEl.textContent = i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' });
                labelEl.style.color = '#dc2626';
            }
        }
        if (lineProgress) lineProgress.style.width = '0%';
        return;
    }

    // Set classes for active and completed steps
    steps.forEach((s, idx) => {
        const el = document.getElementById(`step-${s}`);
        if (!el) return;

        if (idx === currentIdx) {
            el.classList.add('active');
        } else if (idx < currentIdx) {
            el.classList.add('completed');
            const iconEl = el.querySelector('.step-icon');
            if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
    });

    // Update Connecting Line Progress
    if (lineProgress) {
        if (currentIdx === -1) {
            lineProgress.style.width = '0%';
            lineProgress.style.height = '0%';
        } else {
            const percentage = (currentIdx / (steps.length - 1)) * 100;
            lineProgress.style.width = `${percentage}%`;
            lineProgress.style.height = `${percentage}%`;
        }
    }
}

function getImageUrl(url) {
    if (!url) return '/img/placeholder.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getStatusBadgeClass(status) {
    const map = {
        'pending': 'badge-pending',
        'paid': 'badge-paid',
        'preparing': 'badge-preparing',
        'shipped': 'badge-shipped',
        'delivered': 'badge-delivered',
        'cancelled': 'badge-cancelled'
    };
    return map[status] || '';
}

function translateStatus(status) {
    const map = {
        'pending': i18next.t('order.statusPending'),
        'paid': i18next.t('order.statusPaid'),
        'preparing': i18next.t('order.statusPreparing'),
        'shipped': i18next.t('order.statusShipped'),
        'delivered': i18next.t('order.statusDelivered'),
        'cancelled': i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' })
    };
    return map[status] || status;
}

function getPaymentStatusBadgeClass(status) {
    const map = {
        'pending': 'badge-pending',
        'approved': 'badge-delivered',
        'rejected': 'badge-cancelled',
        'failed': 'badge-cancelled',
        'cancelled': 'badge-cancelled'
    };
    return map[status] || '';
}

function translatePaymentStatus(status) {
    const map = {
        'pending': i18next.t('order.paymentStatusPending'),
        'approved': i18next.t('order.paymentStatusApproved'),
        'rejected': i18next.t('order.paymentStatusRejected'),
        'failed': i18next.t('order.paymentStatusFailed'),
        'cancelled': i18next.t('order.paymentStatusCancelled')
    };
    return map[status] || status;
}

async function initiateEpaycoRetry(order) {
    const retryBtn = document.getElementById('btn-retry-payment');
    const originalText = retryBtn.innerHTML;
    retryBtn.disabled = true;
    retryBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    try {
        const epaycoConfig = await apiFetch('/payments/epayco-config');
        const publicKey = epaycoConfig.publicKey || window.EPAYCO_PUBLIC_KEY;
        const backendUrl = epaycoConfig.backendUrlPublic || 'http://localhost:3000/api/v1';

        const handler = ePayco.checkout.configure({
            key: publicKey,
            test: true
        });

        const confirmationUrl = backendUrl.endsWith('/') 
            ? backendUrl + 'payments/webhook' 
            : backendUrl + '/payments/webhook';

        const buyer = Auth.getUser();

        handler.open({
            name: 'ArtHuila',
            description: 'Compra de artesanías - Orden #' + order.id,
            invoice: String(order.id),
            currency: 'cop',
            amount: String(Math.round(order.total_amount)),
            tax_base: '0',
            tax: '0',
            country: 'co',
            lang: 'es',
            external: false,
            response: window.location.origin + '/pago-resultado',
            confirmation: confirmationUrl,
            name_billing: buyer?.full_name || '',
            address_billing: buyer?.address || '',
            mobilephone_billing: buyer?.phone || '',
            email_billing: buyer?.email || ''
        });
    } catch (e) {
        console.error('Retry payment error:', e);
        showToast('Error al iniciar la pasarela de pago: ' + e.message, 'error');
    } finally {
        retryBtn.disabled = false;
        retryBtn.innerHTML = originalText;
    }
}

function getTrackingUrl(carrier, trackingNumber) {
    if (!carrier || !trackingNumber) return '#';
    const c = carrier.toLowerCase();
    if (c.includes('servientrega')) {
        return `https://www.servientrega.com/wps/portal/portal-corporativo/rastreo-envios?id=${trackingNumber}`;
    }
    if (c.includes('coordinadora')) {
        return `https://www.coordinadora.com/detalle-envio/?guia=${trackingNumber}`;
    }
    if (c.includes('interrapidisimo')) {
        return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${trackingNumber}`;
    }
    if (c.includes('envia')) {
        return `https://envia.co/`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' rastreo ' + trackingNumber)}`;
}
