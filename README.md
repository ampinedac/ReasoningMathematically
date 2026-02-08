# 🎓 Piloto Educativo: ¿El orden de los factores altera el producto?

Aplicación web estática para un estudio piloto con niñas de 2° grado sobre la propiedad conmutativa de la multiplicación.

## 📋 Descripción

Este proyecto implementa una experiencia educativa interactiva dividida en 4 momentos:

1. **Momento 1**: Lectura de cuento con flip 3D + Problema Q1 con evidencias
2. **Momento 2**: Tabla progresiva de validación + Problema 1 con evidencias
3. **Momento 3**: Evaluación de veracidad de a×b=b×a + Evidencias
4. **Momento 4**: 6 ítems de completar ecuaciones

### Características principales

✅ Navegación tipo wizard (sin recargar página)  
✅ Pizarra interactiva con múltiples herramientas (lápiz negro, rojo, resaltador, borrador)  
✅ Grabación de audio con MediaRecorder  
✅ Lector de PDF con animación flip 3D (con fallback a fade)  
✅ Guardado automático de evidencias en Firebase (Firestore + Storage)  
✅ Compatible con PC y tablets (touch + mouse)  
✅ Diseño infantil y amigable  

## 📁 Estructura del Proyecto

```
/
├── index.html              # Estructura HTML principal
├── styles.css              # Estilos CSS con diseño infantil
├── main.js                 # Lógica principal de la aplicación
├── firebase.js             # Inicialización de Firebase
├── package.json            # Dependencias del proyecto
├── README.md               # Este archivo
└── assets/
    └── El_Secreto_de_las_Bandejas_de_Dona_Martha.pdf  # Cuento (debes agregarlo)
```

## 🚀 Instalación y Ejecución Local

### Requisitos previos

- Node.js instalado (v14 o superior)
- Un proyecto de Firebase creado
- El archivo PDF del cuento

### Paso 1: Instalar dependencias

Aunque este es un proyecto estático, necesitamos un servidor local para pruebas:

```bash
npm install
```

Si no tienes `package.json`, créalo con:

```bash
npm init -y
npm install --save-dev serve
```

### Paso 2: Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (o usa uno existente)
3. Activa **Firestore Database** y **Storage**
4. Ve a **Project Settings** > **Your apps** > **Web app**
5. Copia las credenciales de configuración

6. Abre `firebase.js` y reemplaza el placeholder con tus credenciales:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Paso 3: Configurar reglas de Firebase (TEMPORAL para piloto)

⚠️ **ADVERTENCIA**: Estas reglas son SOLO para pruebas. NO son seguras para producción.

**Firestore Rules** (Firebase Console > Firestore Database > Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{document=**} {
      allow create, write: if true;  // ⚠️ SOLO PARA PILOTO
      allow read: if false;
    }
  }
}
```

**Storage Rules** (Firebase Console > Storage > Rules):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow write: if true;  // ⚠️ SOLO PARA PILOTO
      allow read: if false;
    }
  }
}
```

> 🔒 **Nota de seguridad**: Después del piloto, debes implementar Authentication o un sistema de PIN para proteger estos datos.

### Paso 4: Agregar el archivo PDF

Coloca el cuento en PDF aquí:

```
assets/El_Secreto_de_las_Bandejas_de_Dona_Martha.pdf
```

El nombre del archivo DEBE coincidir exactamente (o modifica la ruta en `main.js` línea 117).

### Paso 5: Ejecutar localmente

```bash
npx serve .
```

O si instalaste serve globalmente:

```bash
npm install -g serve
serve .
```

Abre tu navegador en: `http://localhost:3000`

## 🌐 Despliegue en GitHub Pages

### Opción 1: Despliegue manual

1. Sube todos los archivos a un repositorio de GitHub
2. Ve a **Settings** > **Pages**
3. Selecciona la rama `main` y carpeta `/ (root)`
4. Guarda y espera unos minutos

Tu sitio estará disponible en: `https://<tu-usuario>.github.io/<nombre-repo>/`

### Opción 2: Usando GitHub CLI

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit: Piloto educativo"

# Crear repositorio en GitHub
gh repo create nombre-del-proyecto --public --source=. --push

# Habilitar GitHub Pages
gh browse --settings
# Luego configura Pages manualmente
```

### Verificar que funcione en GitHub Pages

✅ Asegúrate de que todas las rutas sean relativas:
- `./assets/archivo.pdf` ✅
- `/assets/archivo.pdf` ❌ (no funciona en subdirectorios)

✅ El archivo PDF debe estar en la carpeta `assets/`

✅ Firebase debe estar configurado correctamente en `firebase.js`

## 🛠️ Tecnologías Utilizadas

- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Firebase Web SDK v9+** (modular)
  - Firestore: Base de datos NoSQL
  - Storage: Almacenamiento de archivos
- **PDF.js 3.11.174**: Renderizado de PDF
- **MediaRecorder API**: Grabación de audio
- **Canvas API**: Pizarra interactiva

## 📊 Estructura de Datos en Firestore

Cada evidencia se guarda en la colección `submissions` con esta estructura:

```javascript
{
  studentCode: "EST001",              // Código del estudiante
  activity: "act0",                   // Identificador de actividad
  moment: "m1",                       // m1, m2, m3, m4
  tag: "q1",                          // q1, prob1, q2, table, m4
  createdAt: Timestamp,               // Timestamp del servidor
  boardUrl: "https://...",            // URL de la imagen (nullable)
  audioUrl: "https://...",            // URL del audio (nullable)
  data: {                             // Datos específicos del momento
    // Varía según el momento
  },
  deviceInfo: "Mozilla/5.0...",       // User agent
  pageInfo: {
    currentStep: "m1"
  }
}
```

### Ejemplos de `data` por momento:

**Momento 1 (Q1)**:
```javascript
{ question: "Q1: ¿Quién tiene razón?" }
```

**Momento 2 (Tabla)**:
```javascript
{
  pairs: [[3,7], [5,9], [2,8]],
  attempts: 5,
  errorsConsecutive: 2
}
```

**Momento 3 (Q2)**:
```javascript
{
  a: 7,
  b: 3,
  choice: "yes"  // "yes", "no", "unsure"
}
```

**Momento 4**:
```javascript
{
  responses: [...],
  errorsTotal: 3,
  errorsConsecutiveMax: 2,
  needsSupport: true,
  comment: "No está clara la propiedad conmutativa"
}
```

## 🎨 Personalización

### Cambiar colores

Edita `styles.css` en la sección de variables CSS (si existiera), o busca los gradientes:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Cambiar fuentes

```css
font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif;
```

### Modificar ítems del Momento 4

Edita `index.html` líneas 260-295 (sección Momento 4).

## 🐛 Solución de Problemas

### El PDF no carga

- ✅ Verifica que el archivo exista en `assets/El_Secreto_de_las_Bandejas_de_Dona_Martha.pdf`
- ✅ Comprueba la ruta en `main.js` línea 117
- ✅ Abre la consola del navegador (F12) para ver errores

### No se graba el audio

- ✅ El navegador debe tener permisos de micrófono
- ✅ Solo funciona en HTTPS o localhost (por seguridad)
- ✅ GitHub Pages usa HTTPS automáticamente ✅

### No se guardan las evidencias en Firebase

- ✅ Verifica que `firebase.js` tenga las credenciales correctas
- ✅ Comprueba las reglas de Firestore y Storage
- ✅ Revisa la consola del navegador (F12) para errores
- ✅ Asegúrate de tener créditos/plan activo en Firebase

### La pizarra no dibuja en tablet

- ✅ Verifica que `touch-action: none` esté en el CSS del canvas
- ✅ Prueba en un navegador actualizado

## 📱 Compatibilidad

- ✅ Chrome/Edge (Desktop y móvil)
- ✅ Firefox (Desktop y móvil)
- ✅ Safari (iOS y macOS)
- ⚠️ Internet Explorer: NO compatible

## 📝 Notas Importantes

1. **Privacidad**: Solo se guarda el código estudiantil, NO nombres reales.

2. **Seguridad**: Las reglas de Firebase están abiertas SOLO para el piloto. Después implementa autenticación.

3. **Costos**: Firebase tiene plan gratuito generoso, pero monitorea el uso:
   - Firestore: 50,000 lecturas/día gratuitas
   - Storage: 5GB almacenamiento + 1GB descarga/día

4. **Formato de audio**: Se intenta grabar en `audio/webm;codecs=opus`, fallback a `audio/webm`.

5. **Navegación**: El flujo es lineal, no se puede saltar entre momentos.

## 📞 Soporte

Para preguntas o problemas durante la implementación:

1. Revisa la consola del navegador (F12)
2. Verifica los logs de Firebase Console
3. Comprueba que todos los archivos estén en su lugar

## 📄 Licencia

Este proyecto es para uso educativo en el contexto de un estudio de maestría.

---

**Desarrollado con ❤️ para el piloto educativo sobre conmutatividad en multiplicación**

🎯 **Objetivo**: Que las niñas descubran que el orden de los factores NO altera el producto.
