// dashboard-admin.js
if (!Auth.requireRole('admin')) throw new Error('Not admin');

const user = Auth.getUser();
document.getElementById('admin-welcome').textContent = `Bienvenido/a, ${user.full_name}`;

let pendingRejectId = null;

function showSection(name) {
  ['artesanos', 'auditoria'].forEach(s => {
    document.getElementById(`section-${s}`).classList.add('hidden');
  });
  document.getElementById(`section-${name}`).classList.remove('hidden');
  if (name === 'auditoria') loadAudit();
}

function badgeForStatus(status) {
  const map = {
    pending: 'badge-pending', verified: 'badge-verified',
    rejected: 'badge-rejected', suspended: 'badge-suspended'
  };
  const labels = {
    pending: '⏳ Pendiente', verified: '✅ Verificado',
    rejected: '❌ Rechazado', suspended: '⛔ Suspendido'
  };
  return `<span class="badge ${map[status] || ''}">${labels[status] || status}</span>`;
}

async function loadArtisans() {
  const status = document.getElementById('status-filter').value;
  const tbody = document.getElementById('artisans-table');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><div class="spinner" style="margin:1rem auto;"></div></td></tr>';
  try {
    const qs = status ? `?status=${status}` : '';
    const artisans = await apiFetch('/admin/artisans' + qs);

    // Update stats
    const all = status ? await apiFetch('/admin/artisans') : artisans;
    document.getElementById('stat-pending').textContent = all.filter(a => a.verification_status === 'pending').length;
    document.getElementById('stat-verified').textContent = all.filter(a => a.verification_status === 'verified').length;
    document.getElementById('stat-rejected').textContent = all.filter(a => a.verification_status === 'rejected').length;
    document.getElementById('stat-suspended').textContent = all.filter(a => a.verification_status === 'suspended').length;

    if (artisans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-muted);padding:2rem;">No hay artesanos con este estado</td></tr>';
      return;
    }

    tbody.innerHTML = artisans.map(a => `
      <tr>
        <td>
          <div style="font-weight:600;">${a.user?.full_name || '—'}</div>
          <div style="font-size:0.8rem;color:var(--color-muted);">${a.user?.email || ''}</div>
        </td>
        <td>${a.category?.name || '—'}</td>
        <td>${a.region?.name || '—'}</td>
        <td>${badgeForStatus(a.verification_status)}</td>
        <td>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${a.verification_status !== 'verified'
              ? `<button class="btn btn-success btn-sm" onclick="approveArtisan('${a.id}')">✅ Aprobar</button>` : ''}
            ${a.verification_status !== 'rejected'
              ? `<button class="btn btn-danger btn-sm" onclick="openRejectModal('${a.id}')">❌ Rechazar</button>` : ''}
            ${a.verification_status !== 'suspended'
              ? `<button class="btn btn-warning btn-sm" onclick="suspendArtisan('${a.id}')">⛔ Suspender</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-danger);">${e.message}</td></tr>`;
  }
}

async function approveArtisan(id) {
  if (!confirm('¿Aprobar este artesano?')) return;
  try {
    await apiFetch(`/admin/artisans/${id}/approve`, { method: 'PATCH' });
    showToast('Artesano aprobado y notificado ✅');
    loadArtisans();
  } catch (e) { showToast(e.message, 'error'); }
}

function openRejectModal(id) {
  pendingRejectId = id;
  document.getElementById('reject-reason').value = '';
  document.getElementById('reject-modal').classList.remove('hidden');
  document.getElementById('reject-modal').style.display = 'flex';
}

function closeRejectModal() {
  document.getElementById('reject-modal').classList.add('hidden');
  document.getElementById('reject-modal').style.display = 'none';
  pendingRejectId = null;
}

async function confirmReject() {
  const reason = document.getElementById('reject-reason').value.trim();
  if (!reason) { showToast('La razón es obligatoria', 'error'); return; }
  try {
    await apiFetch(`/admin/artisans/${pendingRejectId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    showToast('Artesano rechazado y notificado');
    closeRejectModal();
    loadArtisans();
  } catch (e) { showToast(e.message, 'error'); }
}

async function suspendArtisan(id) {
  if (!confirm('¿Suspender este artesano?')) return;
  try {
    await apiFetch(`/admin/artisans/${id}/suspend`, { method: 'PATCH' });
    showToast('Artesano suspendido y notificado');
    loadArtisans();
  } catch (e) { showToast(e.message, 'error'); }
}

async function loadAudit() {
  const tbody = document.getElementById('audit-table');
  // Placeholder — audit endpoint not yet exposed publicly; would need an admin GET /audit
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-muted);padding:2rem;">Auditoría registrada internamente en la base de datos</td></tr>';
}

// Init
loadArtisans();
