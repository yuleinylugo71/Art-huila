if (!Auth.getToken()) window.location.href = '/login.html';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    if (!orderId) {
        window.location.href = '/dashboard-comprador.html';
        return;
    }
    loadOrderDetail(orderId);
});

async function loadOrderDetail(orderId) {
    const orderTitle = document.getElementById('order-title');
    const orderDateText = document.getElementById('order-date-text');
    const itemsList = document.getElementById('order-items-list');
    
    try {
        const order = await apiFetch(`/orders/${orderId}`);
        if (!order) {
            showToast('Pedido no encontrado', 'error');
            setTimeout(() => { window.location.href = '/dashboard-comprador.html'; }, 2000);
            return;
        }

        // Title and Date
        orderTitle.textContent = `Pedido #${order.id.substring(0, 8)}`;
        orderDateText.textContent = `Realizado el ${new Date(order.created_at).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`;

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
                    <img src="${imgUrl}" alt="${item.product?.name || 'Producto eliminado'}" class="detail-item-img"/>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">${item.product?.name || 'Producto eliminado'}</h4>
                        <p style="margin: 0.15rem 0 0 0; font-size: 0.8rem; color: var(--color-muted);">Artesano: ${item.product?.artisan?.user?.full_name || 'Art Huila Co'}</p>
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
                    <i class="fa-solid fa-magnifying-glass"></i> Rastrear Envío
                </a>
            `;
        } else {
            trackingNumEl.textContent = '—';
            actionContainer.innerHTML = `
                <div style="font-size: 0.85rem; color: var(--color-muted); text-align: center; font-style: italic; border: 1.5px dashed var(--color-border); padding: 0.75rem; border-radius: var(--radius);">
                    La guía de seguimiento estará disponible una vez que el artesano despache el producto.
                </div>
            `;
        }

        // Shipping Address
        const addressName = document.getElementById('address-name');
        const addressLine = document.getElementById('address-line');
        const addressCity = document.getElementById('address-city');

        const addr = order.shipping_address;
        if (addr && addr.address) {
            addressName.textContent = addr.receiver_name || order.user?.full_name || Auth.getUser().full_name;
            addressLine.textContent = addr.address;
            addressCity.textContent = `${addr.city || 'Municipio Huila'} • Tel: ${addr.phone || '—'}`;
        } else {
            document.getElementById('shipping-address-panel').innerHTML = `
                <div style="font-size: 0.9rem; color: var(--color-danger); font-weight: 600; padding: 0.5rem; background: #fef2f2; border-radius: 4px; border: 1px solid #fecaca; text-align: center;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Dirección no registrada
                </div>
            `;
        }

    } catch (e) {
        console.error(e);
        itemsList.innerHTML = `<div class="error-msg">Error al cargar el detalle del pedido: ${e.message}</div>`;
    }
}

function updateTracker(status) {
    const steps = ['pending', 'paid', 'preparing', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(status);
    
    // Reset classes
    steps.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if (el) el.className = 'step';
    });

    const lineProgress = document.getElementById('tracker-line-progress');
    
    if (status === 'cancelled') {
        // Highlight first step as danger, but show it cancelled
        const firstStep = document.getElementById('step-pending');
        if (firstStep) {
            firstStep.classList.add('active');
            firstStep.querySelector('.step-icon').textContent = '<i class="fa-solid fa-xmark"></i>';
            firstStep.querySelector('.step-label').textContent = 'Cancelado';
            firstStep.querySelector('.step-label').style.color = '#dc2626';
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
            el.querySelector('.step-icon').textContent = '<i class="fa-solid fa-check"></i>';
        }
    });

    // Update Connecting Line Progress
    if (lineProgress) {
        if (currentIdx === -1) {
            lineProgress.style.width = '0%';
        } else {
            const percentage = (currentIdx / (steps.length - 1)) * 100;
            lineProgress.style.width = `${percentage}%`;
        }
    }
}

function getImageUrl(url) {
    if (!url) return '/img/placeholder.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
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
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'preparing': 'En preparación',
        'shipped': 'Despachado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
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
