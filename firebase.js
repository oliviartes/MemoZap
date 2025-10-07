// Importações diretas da CDN (versão web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuração correta do Firebase
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
export const db = getFirestore(app);
export const auth = getAuth(app);

// Funções personalizadas
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendMessage(text) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário precisa estar logado");

  await addDoc(collection(db, "messages"), {
    text,
    uid: user.uid,
    email: user.email,
    timestamp: serverTimestamp()
  });
}

export function listenMessages(callback) {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  return onSnapshot(q, snapshot => {
    const msgs = [];
    snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
}
