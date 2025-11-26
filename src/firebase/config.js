// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBdRJ7IOeI9y2Q6NalEMwPnSbk8JVZqYMo",
    authDomain: "objetivos-imperquimia.firebaseapp.com",
    projectId: "objetivos-imperquimia",
    storageBucket: "objetivos-imperquimia.firebasestorage.app",
    messagingSenderId: "755877807508",
    appId: "1:755877807508:web:2073503b85980fb9537b81"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
export const db = getFirestore(app);
export default app;