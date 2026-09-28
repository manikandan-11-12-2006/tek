import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCoXWuQCNAc3SEPhf08yspyWQsS-IoGkIQ",
  authDomain: "tekpower-57db5.firebaseapp.com",
  projectId: "tekpower-57db5",
  storageBucket: "tekpower-57db5.firebasestorage.app",
  messagingSenderId: "130724847005",
  appId: "1:130724847005:web:8cf315a86673ba58f22374",
  measurementId: "G-GJTQM1SP9Y",
  databaseURL: "https://tekpower-57db5-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { database, app };
