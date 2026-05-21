const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

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

app.listen(PORT, () => {
  console.log(`Frontend server corriendo en http://localhost:${PORT}`);
});
