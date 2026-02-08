# 📊 Cómo Ver los Datos Guardados

## 🔥 Opción 1: Firebase Console (Datos completos)

### Para ver en Firestore (Base de datos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Firestore Database**
4. Verás la colección `submissions` con todos los registros

**Cada documento contiene:**
- `studentCode`: Código del estudiante
- `activity`: "act0"
- `moment`: "m1", "m2", "m3", "m4"
- `tag`: "q1", "prob1", "q2", "table", "m4"
- `createdAt`: Fecha y hora
- `boardUrl`: URL de la imagen de pizarra
- `audioUrl`: URL del audio
- `data`: Objeto con las respuestas específicas
- `deviceInfo`: Información del navegador
- `pageInfo`: Información de la página

### Para ver archivos (Imágenes y audios)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Storage**
4. Navega a la carpeta `uploads/`
5. Dentro verás carpetas por código estudiantil:
   ```
   uploads/
   ├── EST001/
   │   └── act0/
   │       ├── m1/
   │       │   ├── EST001_act0_m1_q1_1234567890.png
   │       │   └── EST001_act0_m1_q1_1234567890.webm
   │       ├── m2/
   │       ├── m3/
   │       └── m4/
   ├── EST002/
   └── ...
   ```

### Descargar todos los datos

**Opción A: Exportar desde Firestore**
1. En Firestore Database, haz clic en los tres puntos (⋮) junto a la colección
2. Selecciona "Export to JSON" o usa Cloud Functions

**Opción B: Usar Firebase CLI**
```bash
firebase firestore:export backup-folder
```

**Opción C: Script personalizado**
Crea un archivo `downloadData.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import fs from 'fs';

// Tu configuración de Firebase
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function downloadAllData() {
  const submissions = [];
  const querySnapshot = await getDocs(collection(db, 'submissions'));
  
  querySnapshot.forEach((doc) => {
    submissions.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  fs.writeFileSync('submissions-export.json', JSON.stringify(submissions, null, 2));
  console.log('✅ Datos exportados a submissions-export.json');
}

downloadAllData();
```

## 📈 Opción 2: Crear un Dashboard

Puedes crear una página de administración simple agregando un archivo `admin.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - Datos del Piloto</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #667eea; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .audio-player, .image-preview { max-width: 300px; }
    </style>
</head>
<body>
    <h1>📊 Dashboard del Piloto</h1>
    <div id="stats"></div>
    <table id="dataTable">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Momento</th>
                <th>Tag</th>
                <th>Pizarra</th>
                <th>Audio</th>
                <th>Datos</th>
            </tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>

    <script type="module">
        import { db, collection } from './firebase.js';
        import { getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

        async function loadData() {
            const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = tbody.insertRow();
                
                row.innerHTML = `
                    <td>${data.createdAt?.toDate().toLocaleString('es-CO') || 'N/A'}</td>
                    <td>${data.studentCode}</td>
                    <td>${data.moment}</td>
                    <td>${data.tag}</td>
                    <td>${data.boardUrl ? `<a href="${data.boardUrl}" target="_blank">Ver imagen</a>` : '-'}</td>
                    <td>${data.audioUrl ? `<audio controls src="${data.audioUrl}"></audio>` : '-'}</td>
                    <td><pre>${JSON.stringify(data.data, null, 2)}</pre></td>
                `;
            });
            
            // Estadísticas
            document.getElementById('stats').innerHTML = `
                <p><strong>Total de registros:</strong> ${querySnapshot.size}</p>
            `;
        }

        loadData();
    </script>
</body>
</html>
```

## 🔒 Importante

**Para uso en producción:**
1. Configura reglas de seguridad en Firebase
2. Implementa autenticación para el dashboard
3. Limita el acceso solo a administradores

## 📱 Acceso Rápido

Durante el piloto, puedes abrir Firebase Console en tu teléfono:
- Descarga la app "Firebase Console" (iOS/Android)
- Inicia sesión con tu cuenta de Google
- Accede a tu proyecto y revisa los datos en tiempo real

---

**¿Necesitas ayuda?** Revisa la [documentación de Firebase](https://firebase.google.com/docs)
