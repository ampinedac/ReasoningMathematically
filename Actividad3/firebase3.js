import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { addDoc, collection, getFirestore, serverTimestamp, setDoc, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBxk5wdPdM8durqj2FHHWbBztd3DJAiBvA',
  authDomain: 'actividad-0.firebaseapp.com',
  projectId: 'actividad-0',
  storageBucket: 'actividad-0.firebasestorage.app',
  messagingSenderId: '1070145508621',
  appId: '1:1070145508621:web:c329b9330950acb3668c44'
};

try {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);

  window.firebaseServices = {
    db,
    storage,
    collection,
    addDoc,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL,
    setDoc,
    getDoc,
    doc
  };

  console.log('Firebase (Actividad3) inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase en Actividad3:', error);
  window.firebaseServices = null;
}
