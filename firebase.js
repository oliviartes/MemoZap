// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAeyyLnVse-vvsRRuNsUsBkaHhCoxC8dmQ",
  authDomain: "memofuturo.firebaseapp.com",
  projectId: "memofuturo",
  storageBucket: "memofuturo.appspot.com",
  messagingSenderId: "932046699518",
  appId: "1:932046699518:web:cb6d1e78618689dcbd9eaf",
  measurementId: "G-3CEEXGN9X6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Funções de registro/login
function registerUser(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export { db, auth, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, registerUser, loginUser };
