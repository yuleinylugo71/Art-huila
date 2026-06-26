let allArtisans = [];

const initArtisansList = async () => {
  const container = document.getElementById('artisans-list-container');
  try {
    const artisans = await apiFetch('/artisans');
    allArtisans = artisans;
    renderArtisans(artisans);
  } catch (error) {
    console.error('Error fetching artisans:', error);
    if (container) {
      container.innerHTML = `<div style="text-align:center;color:red;padding:2rem;">Error al cargar artesanos. Por favor intente más tarde.</div>`;
    }
  }
};

const renderArtisans = (list) => {
  const container = document.getElementById('artisans-list-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--color-muted);padding:3rem;">No se encontraron artesanos.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="artisan-grid">
      ${list.map(artisan => {
        const isVerified = artisan.verification_status === 'verified';
        const imgUrl = artisan.avatar_url || '/img/placeholder-avatar.jpg';
        const name = artisan.user?.full_name || 'Maestro Artesano';
        const regionName = artisan.region?.name || 'Huila';
        const bio = artisan.cultural_history ? artisan.cultural_history.substring(0, 100) + '...' : 'Artesano de maestría ancestral del Huila.';
        
        return `
          <div class="artisan-card" onclick="window.location.href='/artesano.html?id=${artisan.id}'" style="cursor:pointer;">
            <div style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem;">
              <div style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--color-primary); overflow: hidden; position: relative;">
                <img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;" />
                ${isVerified ? `
                  <div style="position: absolute; bottom: 0; right: 0; background: var(--color-primary); color: white; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem;">
                    <i class="fa-solid fa-check"></i>
                  </div>
                ` : ''}
              </div>
              <div>
                <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: #261f1b; margin: 0; display: inline-flex; align-items: center; gap: 0.35rem;">
                  ${name}
                </h3>
                <div style="font-size: 0.75rem; color: var(--color-muted); font-weight: 600; margin-top: 0.2rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
                  <i class="fa-solid fa-location-dot" style="color: var(--color-primary);"></i> ${regionName}
                </div>
              </div>
              <p style="font-size: 0.8rem; color: var(--color-muted); line-height: 1.4; margin: 0.5rem 0 0 0;">${bio}</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.filterArtisans = () => {
  const query = document.getElementById('artisan-search').value.toLowerCase().trim();
  if (!query) {
    renderArtisans(allArtisans);
    return;
  }
  const filtered = allArtisans.filter(a => {
    const name = (a.user?.full_name || '').toLowerCase();
    const regionName = (a.region?.name || '').toLowerCase();
    return name.includes(query) || regionName.includes(query);
  });
  renderArtisans(filtered);
};

if (window.i18nReadyProcessed) {
  initArtisansList();
} else {
  document.addEventListener('i18nReady', initArtisansList);
}
