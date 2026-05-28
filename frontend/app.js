const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8080;

// Interceptar la solicitud de api.js para inyectarle la variable de entorno del API
app.get('/js/api.js', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'js', 'api.js');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading api.js');
    }
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const injectedCode = `window.VITE_API_URL = "${apiUrl}";\n`;
    res.type('application/javascript');
    res.send(injectedCode + data);
  });
});

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rutas dinámicas para páginas HTML
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const fileName = page.endsWith('.html') ? page : `${page}.html`;
  
  res.sendFile(path.join(__dirname, 'views', fileName), (err) => {
    if (err) {
      res.status(404).send('<h1>404 - Página no encontrada</h1><a href="/">Volver al inicio</a>');
    }
  });
});

// Levantar servidor local solo si no se corre como función serverless en Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Frontend server corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
