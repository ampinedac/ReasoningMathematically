// firebase.js - Inicialización de Firebase
// Firebase Web SDK v9+ modular

// Importar funciones necesarias del SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxk5wdPdM8durqj2FHHWbBztd3DJAiBvA",
  authDomain: "actividad-0.firebaseapp.com",
  projectId: "actividad-0",
  storageBucket: "actividad-0.firebasestorage.app",
  messagingSenderId: "1070145508621",
  appId: "1:1070145508621:web:c329b9330950acb3668c44"
};

// Inicializar Firebase
let app, db, storage;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  alert('Advertencia: Firebase no se pudo inicializar. Los datos no se guardarán, pero puedes continuar con la actividad.');
}

// Exportar servicios
export { db, storage };

// Exportar funciones de Firestore
export { collection, addDoc, serverTimestamp };

// Exportar funciones de Storage
export { ref, uploadBytes, getDownloadURL };
