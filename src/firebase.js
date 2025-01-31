// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyBWOST1stTxgP-9Dz8reyaI7CFoDQS6HtI",

  authDomain: "tic-proiect-4682f.firebaseapp.com",

  projectId: "tic-proiect-4682f",

  storageBucket: "tic-proiect-4682f.firebasestorage.app",

  messagingSenderId: "1069733421738",

  appId: "1:1069733421738:web:b88979bbb01931ec0566d3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
