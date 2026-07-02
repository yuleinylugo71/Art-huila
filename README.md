# 🏺 Art Huila - Plataforma E-commerce de Artesanías del Huila

Bienvenido al repositorio oficial de **Art Huila**, una plataforma de comercio electrónico diseñada exclusivamente para promover, preservar y comercializar las artesanías tradicionales del departamento del Huila, Colombia. El proyecto conecta directamente a los artesanos locales con compradores nacionales e internacionales, impulsando el desarrollo cultural y económico de la región.

---

## 🛠️ Arquitectura y Tecnologías

El proyecto está diseñado bajo una arquitectura desacoplada pero integrada de forma profesional:

*   **Backend (API Server)**: Construido en **NestJS** (TypeScript) utilizando **TypeORM** para la comunicación con base de datos **PostgreSQL**.
*   **Frontend (Cliente)**: Aplicación web responsiva basada en **HTML5**, **CSS3 (Vanilla CSS)** y **JavaScript (ES6+)** nativo para optimización de rendimiento.
*   **Servicio de Archivos Estáticos**: NestJS sirve el cliente optimizado, pero la estructura permite despliegues serverless e independientes.
*   **Servicios Externos**:
    *   **Base de datos**: PostgreSQL (soporta Neon.tech y Supabase).
    *   **Imágenes y Archivos**: Cloudinary para el almacenamiento seguro de fotos de productos e identificaciones de artesanos.
    *   **Pasarela de Pagos**: Integración con ePayco.
    *   **Logística de Envíos**: Integración API con MiPaquete.
    *   **Correos**: Envío automático de notificaciones vía SMTP.

---

## 📁 Estructura del Proyecto

El monorepositorio está organizado de la siguiente manera:

```text
├── backend/                  # Servidor de API NestJS (TypeScript)
│   ├── src/                  # Código fuente del servidor (Auth, Products, Orders, etc.)
│   ├── public/               # Archivos estáticos del frontend servidos por el backend
│   ├── seed.ts               # Semilla para poblar categorías y datos iniciales de prueba
│   ├── package.json          # Dependencias y scripts de ejecución
│   └── tsconfig.json         # Configuración del compilador TypeScript
├── frontend/                 # Archivos fuente del frontend (Monolito estático y servidor Express)
│   ├── views/                # Vistas HTML (Home, Tienda, Dashboards, etc.)
│   ├── public/               # Recursos de estilos CSS, imágenes y scripts JS
│   └── vercel.json           # Configuración para despliegue serverless en Vercel
├── GUIA_DESPLIEGUE.md        # Documento detallado para desplegar en Render y Vercel
└── README.md                 # Información general del proyecto
```

---

## ⚡ Guía de Configuración Local

### 1. Requisitos Previos

*   **Node.js**: Versión 18 o superior recomendada.
*   **PostgreSQL**: Base de datos local o remota configurada.

### 2. Configuración del Backend

1.  Navega al directorio de la API:
    ```bash
    cd backend
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raíz de `backend/` usando como guía el archivo `.env.example`. Llena las variables correspondientes:
    *   `DATABASE_URL`: Cadena de conexión de PostgreSQL.
    *   `JWT_SECRET` y `JWT_REFRESH_SECRET`: Claves secretas de cifrado.
    *   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
    *   `MAIL_USER` y `MAIL_PASS` para notificaciones SMTP.
    *   `FRONTEND_URL`: URL del cliente local (ej. `http://localhost:5173`).

### 3. Poblar la Base de Datos (Seed)

Ejecuta el script de siembra para poblar datos maestros obligatorios (municipios del Huila, categorías de artesanías y usuarios de prueba):
```bash
npm run seed
```

### 4. Ejecución del Servidor

*   **Modo Desarrollo**:
    ```bash
    npm run start:dev
    ```
*   **Modo Producción (Build & Run)**:
    ```bash
    npm run build
    npm run start:prod
    ```

El servidor estará escuchando en `http://localhost:3000`.

---

## 📡 Despliegue en la Nube

Para llevar este proyecto a producción (NestJS en Render, Frontend en Vercel, Base de datos en PostgreSQL remota), consulta la guía detallada:

👉 **[Ver Guía de Despliegue Profesional](file:///c:/Users/Yuleiny/OneDrive/Documentos/ecomerce_Arthuila/GUIA_DESPLIEGUE.md)**

---

## 👥 Cuentas de Acceso de Prueba (Seed)

Si ejecutas el script `npm run seed`, tendrás acceso inmediato a las siguientes cuentas de prueba:

*   **Administrador**:
    *   **Usuario**: `admin@arthuila.com`
    *   **Contraseña**: `Admin1234!`
*   **Artesano**:
    *   **Usuario**: `rosa@artesano.com`
    *   **Contraseña**: `Artesano123!`
