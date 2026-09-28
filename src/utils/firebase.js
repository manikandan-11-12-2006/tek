import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDklDpKWcWUPVv-dOGN4ihrHayf0Tg3baY",
  authDomain: "tekpower-e0a53.firebaseapp.com",
  databaseURL: "https://tekpower-e0a53-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tekpower-e0a53",
  storageBucket: "tekpower-e0a53.firebasestorage.app",
  messagingSenderId: "270934275333",
  appId: "1:270934275333:web:2e9a16c5a63035092f736c",
  measurementId: "G-V3WRX9ZNE3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { database, app };
