const BulkUpload = {
  currentFile: null,

  downloadTemplate: async function() {
    try {
      const [cats, regs] = await Promise.all([apiFetch('/categories'), apiFetch('/regions')]);
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();

      // Encabezados descriptivos y amigables en español
      const spanishHeaders = [
        'Nombre del Producto',
        'Enlace del Producto (Slug)',
        'Precio',
        'Cantidad en Inventario',
        'Origen Cultural (Pueblo/Comunidad)',
        'Técnica Artesanal',
        'Significado Cultural',
        'Descripción Corta',
        'Materiales',
        'Dimensiones',
        'Peso',
        'Instrucciones de Cuidado',
        'Categoría',
        'Región',
        'URLs de Imágenes (Separadas por |)',
        'Estado (borrador/publicado)',
        'Hecho a Mano (Sí/No)',
        'Título SEO (Opcional)',
        'Descripción SEO (Opcional)'
      ];

      // Fila de ejemplo con datos típicos colombianos
      const exampleRow = [
        'Mochila Wayuu artesanal',
        'mochila-wayuu-artesanal',
        '125000.50',
        '12',
        'Pueblo Wayuu - La Guajira',
        'Tejido en crochet',
        'Los diseños representan cosmovisión ancestral',
        'Hermosa mochila tejida a mano',
        'Hilo de algodón',
        '30x30 cm',
        '0.5 kg',
        'Lavar a mano',
        cats.length > 0 ? cats[0].name : 'Tejidos',
        regs.length > 0 ? regs[0].name : 'La Guajira',
        'https://ejemplo.com/foto1.jpg',
        'borrador',
        'Sí',
        'Mochila Wayuu | Art Huila',
        'Auténtica mochila colombiana'
      ];

      const wsData = [
        spanishHeaders,
        exampleRow
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Ajustar ancho de columnas para que sea legible
      ws['!cols'] = spanishHeaders.map(h => ({ wch: Math.max(h.length + 4, 15) }));

      XLSX.utils.book_append_sheet(wb, ws, "Plantilla Productos");

      // Hoja 2: Guía de Llenado interactiva
      const wsHelpData = [
        ['GUÍA DE LLENADO DE PLANTILLA - ART HUILA'],
        [''],
        ['Esta guía le ayudará a llenar correctamente la plantilla para cargar sus productos de forma masiva.'],
        [''],
        ['INSTRUCCIONES DE LAS COLUMNAS:'],
        ['Columna', 'Descripción', 'Ejemplo / Restricciones'],
        ['Nombre del Producto', 'Nombre descriptivo de su artesanía.', 'Mochila Wayuu Artesanal (Mínimo 5 caracteres)'],
        ['Enlace del Producto (Slug)', 'Texto amigable para la dirección web. Solo minúsculas, números y guiones.', 'mochila-wayuu-artesanal (Opcional)'],
        ['Precio', 'Precio de venta en números.', '125000.50 (Debe ser mayor a 0)'],
        ['Cantidad en Inventario', 'Unidades físicas disponibles.', '10 (Número entero mayor o igual a 0)'],
        ['Origen Cultural', 'Pueblo o comunidad de donde proviene la técnica o el producto.', 'Pueblo Wayuu - La Guajira (Mínimo 10 caracteres)'],
        ['Técnica Artesanal', 'Técnica de fabricación del producto.', 'Tejido en crochet (Mínimo 10 caracteres)'],
        ['Significado Cultural', 'Significado simbólico o historia de la artesanía.', 'Los diseños representan cosmovisión (Mínimo 20 carac.)'],
        ['Descripción Corta', 'Breve resumen del producto.', 'Hermosa mochila tejida a mano (Máximo 150 carac.)'],
        ['Materiales', 'Materiales utilizados en la fabricación.', 'Hilo de algodón (Opcional)'],
        ['Dimensiones', 'Tamaño físico del producto.', '30x30 cm (Opcional)'],
        ['Peso', 'Peso aproximado del producto.', '0.5 kg (Opcional)'],
        ['Instrucciones de Cuidado', 'Recomendaciones para mantener el producto.', 'Lavar a mano con jabón suave (Opcional)'],
        ['Categoría', 'Debe coincidir exactamente con una de las categorías válidas.', 'Escriba una de las categorías permitidas en la lista de abajo'],
        ['Región', 'Debe coincidir exactamente con una de las regiones válidas.', 'Escriba una de las regiones permitidas en la lista de abajo'],
        ['URLs de Imágenes', 'Direcciones de fotos en internet separadas por el símbolo |.', 'https://ejemplo.com/foto1.jpg|https://ejemplo.com/foto2.jpg (Opcional)'],
        ['Estado', 'Estado de publicación inicial.', 'Use: "borrador", "publicado", "oculto" o "sin stock"'],
        ['Hecho a Mano', 'Si es una artesanía hecha a mano.', 'Use: "Sí" o "No"'],
        ['Título SEO', 'Título del producto optimizado para buscadores como Google.', 'Mochila Wayuu | Art Huila (Opcional)'],
        ['Descripción SEO', 'Descripción optimizada para Google.', 'Auténtica mochila colombiana (Opcional)'],
        [''],
        [''],
        ['LISTAS DE OPCIONES PERMITIDAS:'],
        [''],
        ['CATEGORÍAS PERMITIDAS', '', 'REGIONES PERMITIDAS']
      ];

      // Añadir categorías y regiones dinámicamente lado a lado
      const maxLen = Math.max(cats.length, regs.length);
      for (let i = 0; i < maxLen; i++) {
        const cat = cats[i] ? cats[i].name : '';
        const reg = regs[i] ? regs[i].name : '';
        wsHelpData.push([cat, '', reg]);
      }

      const wsHelp = XLSX.utils.aoa_to_sheet(wsHelpData);
      
      // Ajustar columnas de la hoja de guía
      wsHelp['!cols'] = [
        { wch: 35 },
        { wch: 5 },
        { wch: 35 }
      ];

      XLSX.utils.book_append_sheet(wb, wsHelp, "Guía de Llenado");

      // Exportar y descargar el archivo Excel
      XLSX.writeFile(wb, 'Plantilla_Productos_ArtHuila.xlsx');

    } catch (e) {
      alert('Error generando plantilla: ' + e.message);
    }
  },

  handleDrop: function(e) {
    e.preventDefault();
    document.getElementById('bulk-uploader').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.handleFiles(e.dataTransfer.files);
    }
  },

  handleFiles: function(files) {
    if (files.length === 0) return;
    const file = files[0];
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCsv && !isExcel) {
      alert('Solo se permiten archivos CSV o Excel.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera los 5MB permitidos.');
      return;
    }

    this.currentFile = file;
    this.previewFile(file);
  },

  previewFile: function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        BulkUpload.renderPreview(jsonData.slice(0, 6)); // Encabezado + 5 filas de preview
      } catch (err) {
        console.error('Error previewing file', err);
        alert('Hubo un error al leer el archivo.');
      }
    };
    reader.readAsArrayBuffer(file);
  },

  renderPreview: function(data) {
    const thead = document.querySelector('#bulk-preview-table thead');
    const tbody = document.querySelector('#bulk-preview-table tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) return;

    // Encabezados
    const trHead = document.createElement('tr');
    data[0].forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.background = 'var(--color-bg2)';
      th.style.padding = '0.5rem';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Cuerpo
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Ignorar vacíos o comentarios de guía
      if (!row || row.length === 0 || (row[0] && String(row[0]).startsWith('//'))) continue;

      const tr = document.createElement('tr');
      data[0].forEach((col, idx) => {
        const td = document.createElement('td');
        td.textContent = row[idx] !== undefined ? String(row[idx]).substring(0, 40) : '';
        td.style.padding = '0.5rem';
        td.style.borderBottom = '1px solid var(--color-border)';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    document.getElementById('bulk-step-upload').classList.add('hidden');
    document.getElementById('bulk-step-preview').classList.remove('hidden');
  },

  getCleanFile: function() {
    return new Promise((resolve, reject) => {
      if (!this.currentFile) {
        reject(new Error('No hay archivo seleccionado'));
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Parsear filas como objetos llave-valor
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          // Diccionario para traducir cabeceras en español a las llaves técnicas esperadas en inglés
          const SPANISH_TO_ENGLISH_HEADERS = {
            'nombre del producto': 'name',
            'nombre': 'name',
            'enlace del producto (slug)': 'slug',
            'enlace del producto': 'slug',
            'slug': 'slug',
            'precio': 'price',
            'cantidad en inventario': 'stock',
            'cantidad': 'stock',
            'inventario': 'stock',
            'stock': 'stock',
            'origen cultural (pueblo/comunidad)': 'cultural_origin',
            'origen cultural': 'cultural_origin',
            'origen': 'cultural_origin',
            'tecnica artesanal': 'technique',
            'técnica artesanal': 'technique',
            'tecnica': 'technique',
            'técnica': 'technique',
            'significado cultural': 'significance',
            'significado': 'significance',
            'descripcion corta': 'short_description',
            'descripción corta': 'short_description',
            'materiales': 'materials',
            'dimensiones': 'dimensions',
            'peso': 'weight',
            'instrucciones de cuidado': 'care_instructions',
            'categoria': 'category_name',
            'categoría': 'category_name',
            'region': 'region_name',
            'región': 'region_name',
            'urls de imagenes (separadas por |)': 'image_urls',
            'urls de imágenes (separadas por |)': 'image_urls',
            'urls de imagenes': 'image_urls',
            'urls de imágenes': 'image_urls',
            'imagenes': 'image_urls',
            'imágenes': 'image_urls',
            'estado (borrador/publicado)': 'status',
            'estado': 'status',
            'hecho a mano (si/no)': 'is_handmade',
            'hecho a mano (sí/no)': 'is_handmade',
            'hecho a mano': 'is_handmade',
            'titulo seo (opcional)': 'meta_title',
            'título seo (opcional)': 'meta_title',
            'titulo seo': 'meta_title',
            'título seo': 'meta_title',
            'descripcion seo (opcional)': 'meta_description',
            'descripción seo (opcional)': 'meta_description',
            'descripcion seo': 'meta_description',
            'descripción seo': 'meta_description'
          };

          // Traducir y formatear filas
          const cleanJson = jsonData.map(row => {
            const newRow = {};
            
            // Inicializar las llaves esperadas en vacío para consistencia en SheetJS
            const englishKeys = [
              'name', 'slug', 'price', 'stock', 'cultural_origin', 'technique',
              'significance', 'short_description', 'materials', 'dimensions',
              'weight', 'care_instructions', 'category_name', 'region_name',
              'image_urls', 'status', 'is_handmade', 'meta_title', 'meta_description'
            ];
            
            englishKeys.forEach(k => {
              newRow[k] = '';
            });

            for (const [key, value] of Object.entries(row)) {
              if (key.startsWith('//') || String(value).startsWith('//')) {
                continue; // Saltar filas descriptivas o comentarios de guía
              }
              const normKey = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const engKey = SPANISH_TO_ENGLISH_HEADERS[normKey] || key;
              
              let finalValue = value;
              
              // Estandarizar booleanos y estados
              if (engKey === 'is_handmade') {
                const vStr = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (vStr === 'si' || vStr === 'yes' || vStr === 'true' || vStr === 'verdadero' || vStr === '1') {
                  finalValue = 'true';
                } else if (vStr === 'no' || vStr === 'false' || vStr === 'falso' || vStr === '0') {
                  finalValue = 'false';
                }
              } else if (engKey === 'status') {
                const vStr = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (vStr === 'borrador') finalValue = 'draft';
                else if (vStr === 'publicado') finalValue = 'published';
                else if (vStr === 'sin stock' || vStr === 'sin_stock' || vStr === 'agotado') finalValue = 'out_of_stock';
                else if (vStr === 'oculto') finalValue = 'hidden';
              } else if (engKey === 'image_urls' && Array.isArray(value)) {
                finalValue = value.join('|');
              }

              if (finalValue !== null && finalValue !== undefined) {
                newRow[engKey] = String(finalValue).trim();
              }
            }
            return newRow;
          });

          // Crear archivo Excel limpio temporal para la validación y carga del backend
          const cleanWb = XLSX.utils.book_new();
          const cleanWs = XLSX.utils.json_to_sheet(cleanJson, {
            header: [
              'name', 'slug', 'price', 'stock', 'cultural_origin', 'technique',
              'significance', 'short_description', 'materials', 'dimensions',
              'weight', 'care_instructions', 'category_name', 'region_name',
              'image_urls', 'status', 'is_handmade', 'meta_title', 'meta_description'
            ]
          });
          XLSX.utils.book_append_sheet(cleanWb, cleanWs, "Products");
          
          const outBuffer = XLSX.write(cleanWb, { type: 'array', bookType: 'xlsx' });
          const cleanBlob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          resolve(cleanBlob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this.currentFile);
    });
  },

  validateData: async function() {
    if (!this.currentFile) return;

    document.getElementById('bulk-step-preview').classList.add('hidden');
    document.getElementById('bulk-step-progress').classList.remove('hidden');
    document.getElementById('bulk-progress-title').textContent = 'Validando archivo...';
    document.getElementById('bulk-progress-desc').textContent = 'Analizando filas, campos y referencias cruzadas.';

    try {
      const cleanBlob = await this.getCleanFile();
      const formData = new FormData();
      formData.append('file', cleanBlob, 'clean_upload.xlsx');

      const res = await apiFetch('/products/validate', {
        method: 'POST',
        body: formData,
        headers: {} // apiFetch manejará los boundaries multipart automáticamente
      });

      if (!res.valid) {
        this.showErrors(res.errors);
      } else {
        await this.processUpload();
      }
    } catch (err) {
      document.getElementById('bulk-step-progress').classList.add('hidden');
      alert(err.message || 'Error en la validación.');
      this.reset();
    }
  },

  showErrors: function(errors) {
    document.getElementById('bulk-step-progress').classList.add('hidden');
    document.getElementById('bulk-step-errors').classList.remove('hidden');

    const tbody = document.getElementById('bulk-errors-list');
    tbody.innerHTML = '';

    errors.forEach(err => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:0.5rem;border-bottom:1px solid var(--color-border);">${err.row}</td>
        <td style="padding:0.5rem;border-bottom:1px solid var(--color-border);font-weight:600;">${err.field}</td>
        <td style="padding:0.5rem;border-bottom:1px solid var(--color-border);color:var(--color-muted);">${err.value !== undefined ? err.value : ''}</td>
        <td style="padding:0.5rem;border-bottom:1px solid var(--color-border);color:#b91c1c;">${err.message}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  processUpload: async function() {
    document.getElementById('bulk-progress-title').textContent = 'Procesando carga masiva...';
    document.getElementById('bulk-progress-desc').textContent = 'Insertando productos y procesando imágenes. Por favor no cierres esta ventana.';

    try {
      const cleanBlob = await this.getCleanFile();
      const formData = new FormData();
      formData.append('file', cleanBlob, 'clean_upload.xlsx');

      const res = await apiFetch('/products/bulk-upload', {
        method: 'POST',
        body: formData,
        headers: {} 
      });

      document.getElementById('bulk-step-progress').classList.add('hidden');
      document.getElementById('bulk-step-success').classList.remove('hidden');
      document.getElementById('bulk-success-desc').textContent = `Se han importado ${res.insertedCount} productos correctamente en ${res.processingTimeMs}ms.`;
    } catch (err) {
      document.getElementById('bulk-step-progress').classList.add('hidden');
      alert(err.message || 'Error durante la carga masiva.');
      this.reset();
    }
  },

  reset: function() {
    this.currentFile = null;
    document.getElementById('bulk-input').value = '';
    
    document.getElementById('bulk-step-upload').classList.remove('hidden');
    document.getElementById('bulk-step-preview').classList.add('hidden');
    document.getElementById('bulk-step-errors').classList.add('hidden');
    document.getElementById('bulk-step-progress').classList.add('hidden');
    document.getElementById('bulk-step-success').classList.add('hidden');
  }
};
