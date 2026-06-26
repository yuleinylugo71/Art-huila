// registro.js
let selectedType = null;

const runInitRegistro = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initRegistro();
};

if (window.i18nReadyProcessed) {
  runInitRegistro();
} else {
  document.addEventListener('i18nReady', runInitRegistro);
}

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  loadSelects(); // Reload selects to update the placeholder option language
});

function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-card').forEach(c => {
    c.style.border = '2px solid var(--color-border)';
    c.style.transform = 'none';
  });
  const card = document.getElementById(`type-${type}`);
  if (card) {
    card.style.border = '2px solid var(--color-primary)';
    card.style.transform = 'scale(1.02)';
  }

  const authLayout = document.querySelector('.auth-layout');
  if (authLayout) {
    // Smoothly toggle the register-width class based on the form type
    if (type === 'artesano') {
      authLayout.classList.add('auth-layout-register');
    } else {
      authLayout.classList.remove('auth-layout-register');
    }
  }

  // Switch the forms (add/remove .hidden)
  const formComp = document.getElementById('form-comprador');
  const formArte = document.getElementById('form-artesano');
  if (formComp) formComp.classList.add('hidden');
  if (formArte) formArte.classList.add('hidden');

  const selectedForm = document.getElementById(`form-${type}`);
  if (selectedForm) selectedForm.classList.remove('hidden');
}

// Load categories and regions for artisan form
async function loadSelects() {
  try {
    const [cats, regs] = await Promise.all([
      apiFetch('/categories'),
      apiFetch('/regions'),
    ]);
    const catSel = document.getElementById('a-categoria');
    const regSel = document.getElementById('a-region');
    if (catSel) {
      catSel.innerHTML = `<option value="">${i18next.t('artisan.selectCategoryOption')}</option>` +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    if (regSel) {
      regSel.innerHTML = `<option value="">${i18next.t('artisan.selectRegionOption')}</option>` +
        regs.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
  } catch (e) {
    console.error('Error loading selects', e);
  }
}

function initRegistro() {
  loadSelects();

  // Buyer registration
  const formComprador = document.getElementById('form-comprador');
  if (formComprador) {
    formComprador.onsubmit = async function(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-comprador');
      btn.disabled = true; 
      btn.textContent = i18next.t('register.registering');
      try {
        await apiFetch('/auth/register/comprador', {
          method: 'POST',
          body: JSON.stringify({
            full_name: document.getElementById('c-name').value,
            email: document.getElementById('c-email').value,
            password: document.getElementById('c-pass').value,
            role: 'comprador',
          }),
        });
        window.location.href = '/login.html?registered=true';
      } catch (err) {
        const el = document.getElementById('error-msg');
        el.textContent = err.message; el.classList.remove('hidden');
        btn.disabled = false; 
        btn.textContent = i18next.t('register.createBuyerAccountBtn');
      }
    };
  }

  // Artisan registration
  const formArtesano = document.getElementById('form-artesano');
  if (formArtesano) {
    formArtesano.onsubmit = async function(e) {
      e.preventDefault();
      
      const declaration = document.getElementById('a-declaracion');
      if (!declaration.checked) {
        const el = document.getElementById('error-msg');
        el.textContent = i18next.t('register.errorMustAcceptDeclaration'); 
        el.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('btn-artesano');
      btn.disabled = true; 
      btn.textContent = i18next.t('register.processingRegistration');
      
      try {
        const formData = new FormData();
        formData.append('full_name', document.getElementById('a-name').value);
        formData.append('email', document.getElementById('a-email').value);
        formData.append('password', document.getElementById('a-pass').value);
        formData.append('role', 'artesano');
        formData.append('cultural_history', document.getElementById('a-historia').value);
        formData.append('category_id', document.getElementById('a-categoria').value);
        formData.append('region_id', document.getElementById('a-region').value);
        formData.append('truthfulness_declaration', 'true');

        // Handle files
        const docFrontFile = document.getElementById('a-document-front').files[0];
        if (docFrontFile) {
          formData.append('id_document_front', docFrontFile);
        }

        const docBackFile = document.getElementById('a-document-back').files[0];
        if (docBackFile) {
          formData.append('id_document_back', docBackFile);
        }

        const galleryFiles = document.getElementById('a-galeria').files;
        for (let i = 0; i < galleryFiles.length; i++) {
          formData.append('gallery', galleryFiles[i]);
        }

        await apiFetch('/auth/register/artesano', {
          method: 'POST',
          body: formData, // FormData matches multipart/form-data
        });
        
        window.location.href = '/verificar-email.html';
      } catch (err) {
        const el = document.getElementById('error-msg');
        el.textContent = err.message; el.classList.remove('hidden');
        btn.disabled = false; 
        btn.textContent = i18next.t('register.registerAsArtisanBtn');
      }
    };
  }
}
