# 🚀 Guía de Despliegue Profesional - Art Huila

Esta guía te guiará paso a paso para desplegar el backend de **NestJS** en **Render**, el frontend de **Express** en **Vercel** y conectar una base de datos **PostgreSQL remota** en la nube.

---

## 📋 Arquitectura Final de Producción

```mermaid
graph TD
    User([Navegador del Cliente]) -->|Navega en Web| Frontend[Vercel Serverless Express]
    User -->|Peticiones API con JWT| Backend[Render NestJS Web Service]
    Backend -->|TypeORM Query| DB[(PostgreSQL en la Nube)]
```

---

## 🛠️ Paso 1: Crear la Base de Datos PostgreSQL Remota

Puedes crear una base de datos PostgreSQL gratuita en la nube usando proveedores modernos como **Supabase** o **Neon.tech**.

1. Regístrate en [Supabase](https://supabase.com/) o [Neon](https://neon.tech/).
2. Crea un proyecto nuevo e introduce una contraseña segura para tu base de datos.
3. En la sección de configuración de la conexión (Connection Settings), copia la **cadena de conexión completa** (Connection String), que tendrá un formato como este:
   ```text
   postgresql://postgres:clave_segura@db.supabase.co:5432/postgres
   ```
4. **Guardar datos de semilla (Seed) en producción:**
   Antes de subir tu sistema, puedes poblar tu base de datos remota con las categorías del Huila, municipios y usuarios de prueba. En tu terminal local de PowerShell, corre:
   ```powershell
   # Configura temporalmente la base de datos remota en la terminal
   $env:DATABASE_URL="tu_cadena_de_conexion_remota"
   
   # Ejecuta la siembra en la base de datos remota
   cd backend
   npm run seed
   ```

---

## 📡 Paso 2: Desplegar el Backend en Render

1. Regístrate o inicia sesión en [Render](https://render.com/).
2. Haz clic en el botón azul **New +** y selecciona **Web Service**.
3. Conecta tu cuenta de GitHub e importa tu repositorio del proyecto.
4. En el formulario de configuración, define lo siguiente:
   * **Name:** `arthuila-backend`
   * **Region:** Selecciona la más cercana (ej: `Oregon` u `Ohio`).
   * **Branch:** `feature/production-deployment` (tu rama de despliegue)
   * **Root Directory:** `backend`
   * **Language:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start:prod`
5. Baja a la sección **Environment Variables** y añade las siguientes claves:
   
   | Variable | Valor Recomendado / Descripción |
   | :--- | :--- |
   | `DATABASE_URL` | *Tu cadena de conexión a PostgreSQL remota* |
   | `PORT` | `3000` *(o déjalo en blanco para que Render lo maneje)* |
   | `FRONTEND_URL` | `https://tu-app-en-vercel.vercel.app` *(Tu dominio final en Vercel)* |
   | `JWT_SECRET` | *Genera una clave aleatoria súper segura* |
   | `JWT_REFRESH_SECRET`| *Genera otra clave aleatoria súper segura* |
   | `CLOUDINARY_CLOUD_NAME`| `dcoj4c3ay` *(Tus credenciales de Cloudinary)* |
   | `CLOUDINARY_API_KEY`| *Tu clave de API de Cloudinary* |
   | `CLOUDINARY_API_SECRET`| *Tu secreto de API de Cloudinary* |
   | `MAIL_USER` | `arthuila3@gmail.com` *(O tu correo de SMTP)* |
   | `MAIL_PASS` | `yngl vrbk ormc dibm` *(Tu contraseña de aplicación)* |
6. Haz clic en **Create Web Service**. ¡Render empezará a compilar y levantar tu NestJS de inmediato!

---

## 🎨 Paso 3: Desplegar el Frontend en Vercel

1. Regístrate o inicia sesión en [Vercel](https://vercel.com/).
2. Haz clic en **Add New** > **Project**.
3. Importa el repositorio de GitHub de tu proyecto.
4. En la configuración del proyecto (Project Settings):
   * **Root Directory:** Haz clic en **Edit** y selecciona la carpeta `frontend`.
   * **Framework Preset:** Selecciona **Other** (Vercel detectará el archivo `vercel.json` y levantará la aplicación serverless sin necesidad de compilación).
5. Abre la sección de **Environment Variables** y añade:
   
   | Clave | Valor |
   | :--- | :--- |
   | `VITE_API_URL` | `https://tu-backend-en-render.onrender.com/api/v1` *(La URL que te asigne Render)* |

6. Haz clic en **Deploy**. ¡Tu frontend de Express estará listo en segundos y disponible para todo el mundo!

---

## 🛡️ Paso 4: Verificación Final

Una vez completados los despliegues:
1. Abre tu dominio de Vercel (ej: `https://tu-app-en-vercel.vercel.app`).
2. Haz clic derecho, selecciona **Inspeccionar (F12)** y ve a la pestaña **Consola**.
3. Verifica que las peticiones apunten correctamente a la URL de Render (no deben aparecer llamadas a `localhost:3000`).
4. Ve a la pantalla de **Login**, ingresa con las credenciales de prueba y verifica que el inicio de sesión se procese de manera fluida:
   * **Admin:** `admin@arthuila.com` / `Admin1234!`
   * **Artesano:** `rosa@artesano.com` / `Artesano123!`
