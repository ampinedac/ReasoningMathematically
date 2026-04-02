// firebase2.js - Inicialización de Firebase para Actividad2
// Firebase Web SDK v9+ modular

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyBxk5wdPdM8durqj2FHHWbBztd3DJAiBvA",
    authDomain: "actividad-0.firebaseapp.com",
    projectId: "actividad-0",
    storageBucket: "actividad-0.firebasestorage.app",
    messagingSenderId: "1070145508621",
    appId: "1:1070145508621:web:c329b9330950acb3668c44"
};

let app, db, storage;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase (Actividad2) inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
}

export { db, storage };
export { collection, addDoc, serverTimestamp };
export { ref, uploadBytes, getDownloadURL };
