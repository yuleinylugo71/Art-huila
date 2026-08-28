// i18n.js - Soporte de Internacionalización y Multilingüismo (HU-SEO-02)

(function () {
  if (typeof window.i18next === 'undefined') {
    let currentLang = localStorage.getItem('arthuila_lang');
    if (!currentLang) {
      const browserLang = (navigator.language || navigator.userLanguage || 'es').substring(0, 2);
      currentLang = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
    }

    const resources = {};
    const getByPath = (obj, key) => key.split('.').reduce((acc, part) => acc && acc[part], obj);
    const interpolate = (value, params = {}) => String(value).replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '');

    const miniI18n = {
      get language() {
        return currentLang;
      },
      t(key, options = {}) {
        const activeValue = getByPath(resources[currentLang] || {}, key);
        const fallbackValue = getByPath(resources.es || {}, key);
        const value = activeValue ?? fallbackValue ?? options.defaultValue ?? key;
        return interpolate(value, options);
      },
      changeLanguage(lang, callback) {
        loadLanguage(lang).then(() => callback && callback(null, miniI18n.t.bind(miniI18n))).catch(callback);
      },
      hasResourceBundle(lang) {
        return Boolean(resources[lang]);
      }
    };

    window.i18next = miniI18n;

    async function loadLanguage(lang) {
      if (!['es', 'en'].includes(lang)) return;
      if (!resources[lang]) {
        const response = await fetch(`/locales/${lang}/translation.json`);
        resources[lang] = await response.json();
      }
      currentLang = lang;
      localStorage.setItem('arthuila_lang', lang);
      document.documentElement.lang = lang;
    }

    function initTranslations() {
      document.documentElement.lang = currentLang;
      updateSwitcherButtons(currentLang);
      window.applyTranslations();
      window.i18nReadyProcessed = true;
      document.dispatchEvent(new CustomEvent('i18nReady'));
    }

    window.changeLanguage = function (lang) {
      if (!['es', 'en'].includes(lang)) return;
      loadLanguage(lang).then(() => {
        updateSwitcherButtons(lang);
        window.applyTranslations();
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
      }).catch(err => console.error('Error al cambiar de idioma:', err));
    };

    window.applyTranslations = function () {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const translationKey = el.dataset.i18n;
        if (translationKey) el.textContent = miniI18n.t(translationKey);
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const placeholderKey = el.dataset.i18nPlaceholder;
        if (placeholderKey) el.placeholder = miniI18n.t(placeholderKey);
      });

      document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const tooltipKey = el.dataset.i18nTooltip;
        if (tooltipKey) el.setAttribute('data-tooltip', miniI18n.t(tooltipKey));
      });

      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const titleKey = el.dataset.i18nTitle;
        if (titleKey) el.setAttribute('title', miniI18n.t(titleKey));
      });
    };

    window.translateCategory = function (name) {
      if (!name) return '';
      const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.includes('tejeduria')) return miniI18n.t('home.categoryTejeduria');
      if (norm.includes('ceramica')) return miniI18n.t('home.categoryCeramica');
      if (norm.includes('talla')) return miniI18n.t('home.categoryTalla');
      if (norm.includes('orfebreria')) return miniI18n.t('home.categoryOrfebreria');
      if (norm.includes('joyeria')) return miniI18n.t('home.categoryJoyeria');
      if (norm.includes('sombrero') || norm.includes('sombrereria')) return miniI18n.t('home.categorySombreros');
      return name;
    };

    window.translateProduct = function (p) {
      if (!p) return '';
      if (typeof p !== 'string' && currentLang === 'en' && p.name_en) return p.name_en;
      const name = typeof p === 'string' ? p : p.name;
      let slug = typeof p === 'string' ? null : p.slug;
      if (!slug) {
        slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return miniI18n.t('products.' + slug, { defaultValue: name });
    };

    window.translateProductField = function (p, field, fallback = '') {
      if (!p) return fallback;
      if (currentLang === 'en' && p[`${field}_en`]) return p[`${field}_en`];
      return p[field] || fallback;
    };

    function updateSwitcherButtons(lang) {
      document.querySelectorAll('.btn-lang-es, #btn-lang-es').forEach(btn => btn.classList.toggle('active', lang === 'es'));
      document.querySelectorAll('.btn-lang-en, #btn-lang-en').forEach(btn => btn.classList.toggle('active', lang === 'en'));
      const mobileToggle = document.getElementById('mobile-lang-toggle');
      if (mobileToggle) mobileToggle.textContent = lang.toUpperCase();
    }

    loadLanguage(currentLang)
      .then(() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initTranslations);
        } else {
          initTranslations();
        }
      })
      .catch(err => console.error('Error al inicializar traducciones:', err));

    return;
  }

  // 1. DETECCIÓN DE IDIOMA
  let detectedLang = localStorage.getItem('arthuila_lang');
  
  if (!detectedLang) {
    const browserLang = (navigator.language || navigator.userLanguage || 'es').substring(0, 2);
    detectedLang = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
  }

  // 2. CONFIGURACIÓN E INICIALIZACIÓN
  i18next
    .use(i18nextHttpBackend)
    .init({
      lng: detectedLang,
      fallbackLng: 'es',
      supportedLngs: ['es', 'en'],
      defaultNS: 'translation',
      backend: {
        loadPath: '/locales/{{lng}}/translation.json'
      }
    }, function (err, t) {
      if (err) {
        console.error('Error al inicializar i18next:', err);
        return;
      }
      
      // Ejecutar cuando el DOM esté listo para evitar errores de elementos no cargados
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslations);
      } else {
        initTranslations();
      }
    });

  // Función interna para inicializar el estado del DOM y despachar i18nReady
  function initTranslations() {
    document.documentElement.lang = i18next.language;
    updateSwitcherButtons(i18next.language);
    window.applyTranslations();
    
    // Set a global flag to prevent race conditions on scripts loaded later
    window.i18nReadyProcessed = true;
    
    // Disparar evento i18nReady en document
    document.dispatchEvent(new CustomEvent('i18nReady'));
  }

  // 3. FUNCIÓN GLOBAL PARA CAMBIAR IDIOMA
  window.changeLanguage = function (lang) {
    if (!['es', 'en'].includes(lang)) return;

    i18next.changeLanguage(lang, function (err, t) {
      if (err) {
        console.error('Error al cambiar de idioma:', err);
        return;
      }

      localStorage.setItem('arthuila_lang', lang);
      document.documentElement.lang = lang;
      
      updateSwitcherButtons(lang);
      window.applyTranslations();

      // Disparar evento languageChanged en document sin recargar la página
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    });
  };

  // 4. FUNCIÓN GLOBAL PARA APLICAR TRADUCCIONES EN EL DOM
  window.applyTranslations = function () {
    // Traducir textos usando data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const translationKey = el.dataset.i18n;
      if (translationKey) {
        el.textContent = i18next.t(translationKey);
      }
    });

    // Traducir placeholders usando data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const placeholderKey = el.dataset.i18nPlaceholder;
      if (placeholderKey) {
        el.placeholder = i18next.t(placeholderKey);
      }
    });

    // Traducir tooltips usando data-i18n-tooltip
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
      const tooltipKey = el.dataset.i18nTooltip;
      if (tooltipKey) {
        el.setAttribute('data-tooltip', i18next.t(tooltipKey));
      }
    });

    // Traducir titles usando data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const titleKey = el.dataset.i18nTitle;
      if (titleKey) {
        el.setAttribute('title', i18next.t(titleKey));
      }
    });
  };

  window.translateCategory = function (name) {
    if (!name) return '';
    const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (norm.includes('tejeduria')) return i18next.t('home.categoryTejeduria');
    if (norm.includes('ceramica')) return i18next.t('home.categoryCeramica');
    if (norm.includes('talla')) return i18next.t('home.categoryTalla');
    if (norm.includes('orfebreria')) return i18next.t('home.categoryOrfebreria');
    if (norm.includes('joyeria')) return i18next.t('home.categoryJoyeria');
    if (norm.includes('sombrero') || norm.includes('sombrereria')) return i18next.t('home.categorySombreros');
    return name;
  };

  window.translateProduct = function (p) {
    if (!p) return '';
    if (typeof p !== 'string' && i18next.language === 'en' && p.name_en) {
      return p.name_en;
    }
    const name = typeof p === 'string' ? p : p.name;
    let slug = typeof p === 'string' ? null : p.slug;
    if (!slug) {
      slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    return i18next.t('products.' + slug, { defaultValue: name });
  };

  window.translateProductField = function (p, field, fallback = '') {
    if (!p) return fallback;
    const lang = i18next.language || 'es';
    if (lang === 'en' && p[`${field}_en`]) return p[`${field}_en`];
    return p[field] || fallback;
  };

  // 5. ACTUALIZAR CLASE ACTIVE EN EL SELECTOR DE IDIOMA
  function updateSwitcherButtons(lang) {
    document.querySelectorAll('.btn-lang-es, #btn-lang-es').forEach(btn => {
      if (lang === 'es') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    document.querySelectorAll('.btn-lang-en, #btn-lang-en').forEach(btn => {
      if (lang === 'en') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const mobileToggle = document.getElementById('mobile-lang-toggle');
    if (mobileToggle) {
      mobileToggle.textContent = lang.toUpperCase();
    }
  }
})();

// PATRÓN PARA CADA SCRIPT DE VISTA:
// document.addEventListener('i18nReady', () => {
//   applyTranslations();
//   initNombreDelModulo();
// });
// document.addEventListener('languageChanged', () => {
//   applyTranslations();
//   initNombreDelModulo(); // re-renderiza con nuevo idioma
// });
