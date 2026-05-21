// i18n.js - Soporte de Internacionalización y Multilingüismo (HU-SEO-02)

(function () {
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
  };

  // 5. ACTUALIZAR CLASE ACTIVE EN EL SELECTOR DE IDIOMA
  function updateSwitcherButtons(lang) {
    const btnEs = document.getElementById('btn-lang-es');
    const btnEn = document.getElementById('btn-lang-en');
    
    if (btnEs) {
      if (lang === 'es') {
        btnEs.classList.add('active');
      } else {
        btnEs.classList.remove('active');
      }
    }
    
    if (btnEn) {
      if (lang === 'en') {
        btnEn.classList.add('active');
      } else {
        btnEn.classList.remove('active');
      }
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
