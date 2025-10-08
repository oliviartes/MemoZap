// -----------------------
// Firebase Config e Inicialização
// -----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, updateEmail, updatePassword, sendEmailVerification, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyAeyyLnVse-vvsRRuNsUsBkaHhCoxC8dmQ",
  authDomain: "memofuturo.firebaseapp.com",
  projectId: "memofuturo",
  storageBucket: "memofuturo.appspot.com",
  messagingSenderId: "932046699518",
  appId: "1:932046699518:web:cb6d1e78618689dcbd9eaf",
  measurementId: "G-3CEEXGN9X6"
};

// Inicializar
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// -----------------------
// Funções Auth
// -----------------------
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function updateUserProfile(user, displayName, photoURL) {
  return updateProfile(user, { displayName, photoURL });
}

export async function updateUserEmailFn(user, email) {
  return updateEmail(user, email);
}

export async function updateUserPasswordFn(user, password) {
  return updatePassword(user, password);
}

export async function sendVerificationEmailFn(user) {
  return sendEmailVerification(user);
}

export async function sendResetPasswordEmailFn(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function deleteUserAccountFn(user) {
  return deleteUser(user);
}

export async function reauthenticateUserFn(user, email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  return reauthenticateWithCredential(user, credential);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
