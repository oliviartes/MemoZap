// user.js
import { auth, db } from './firebaseConfig.js';
import { 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let currentUser = null;
let lastSeenUnsub = null;

// ====== Mantém sessão persistente ======
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.warn("Não foi possível setar persistence:", err);
  }
})();

// ====== Interface de autenticação ======
function setAuthUI(user, sendBtn, messagesDiv, lastSeenDiv) {
  if (user) {
    document.body.classList.add('logged-in');

    // Se o botão ainda existir em alguma tela, protege contra erro
    if (sendBtn) sendBtn.disabled = false;
  } else {
    document.body.classList.remove('logged-in');

    if (sendBtn) sendBtn.disabled = true;
    if (messagesDiv) messagesDiv.innerHTML = '';
    if (lastSeenDiv) lastSeenDiv.textContent = '';
  }
}

// ====== Atualiza último visto ======
async function updateLastSeen() {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  try {
    await updateDoc(userRef, { lastSeen: serverTimestamp() });
  } catch (err) {
    console.warn("Erro ao atualizar último visto:", err);
  }
}

// ====== Mostra status e último visto ======
function showLastSeen(contactUid, lastSeenDiv) {
  if (!lastSeenDiv) return;
  if (lastSeenUnsub) lastSeenUnsub();

  const userRef = doc(db, "users", contactUid);
  lastSeenUnsub = onSnapshot(userRef, snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();

    if (!data.lastSeen) {
      lastSeenDiv.textContent = 'Online';
      return;
    }

    const lastSeenDate = data.lastSeen.toDate();
    const now = new Date();
    const diff = (now - lastSeenDate) / 1000;

    if (diff < 60) {
      lastSeenDiv.textContent = 'Online';
    } else {
      const hours = lastSeenDate.getHours().toString().padStart(2, '0');
      const minutes = lastSeenDate.getMinutes().toString().padStart(2, '0');
      lastSeenDiv.textContent = `Último visto: ${hours}:${minutes}`;
    }
  });
}

// ====== Listener de autenticação global ======
function authListener(callback) {
  onAuthStateChanged(auth, user => {
    currentUser = user;
    callback(user);
  });
}

export { currentUser, setAuthUI, showLastSeen, updateLastSeen, authListener };
