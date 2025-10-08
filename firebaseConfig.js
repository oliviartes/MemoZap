import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeyyLnVse-vvsRRuNsUsBkaHhCoxC8dmQ",
  authDomain: "memofuturo.firebaseapp.com",
  projectId: "memofuturo",
  storageBucket: "memofuturo.appspot.com",
  messagingSenderId: "932046699518",
  appId: "1:932046699518:web:cb6d1e78618689dcbd9eaf",
  measurementId: "G-3CEEXGN9X6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };
