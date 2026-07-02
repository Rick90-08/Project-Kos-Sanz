// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyD_CL_K6rtVWXze-twiwpXGND9PHAHIg-o",
  authDomain: "smartkos-xyz.firebaseapp.com",
  projectId: "smartkos-xyz",
  storageBucket: "smartkos-xyz.firebasestorage.app",
  messagingSenderId: "987027117793",
  appId: "1:987027117793:web:bc798f202b9a205ebe09a0"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication dan Database agar bisa dipakai di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);