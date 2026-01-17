// chat.js (arquivo completo)
// Dependências esperadas:
// - ./firebaseConfig.js exportando { auth, db, storage }
// - ./upload.js exportando uploadFile (se for usado)
// - ./mapa.js exportando initMap, goToAddress
// Usa Firebase modular v9.6.1

import { uploadFile } from "./upload.js";
import { auth, db, storage } from './firebaseConfig.js';
import { initMap, goToAddress } from './mapa.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// ------------------ DOM ------------------
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const previewDiv = document.getElementById('messagePreview');
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

const updateProfileBtn = document.getElementById('updateProfileBtn');
const updateEmailBtn = document.getElementById('updateEmailBtn');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const sendVerificationBtn = document.getElementById('sendVerificationBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');

const addContactBtn = document.getElementById('addContactBtn');
const addContactInput = document.getElementById('addContactInput');
const contactsListDiv = document.getElementById('contactsList');

const newChatBtn = document.getElementById('newChatBtn');

const openMapBtn = document.getElementById('openMapBtn');
const mapModal = document.getElementById('mapModal');
const closeMapModal = document.getElementById('closeMapModal');
const logoutBtn = document.getElementById('logoutBtn'); // opcional

let currentUser = null;
let messagesUnsubscribe = null;
let contactsUnsubscribe = null;

// imagens hospedadas permitidas (whitelist)
const HOSTING_IMAGES = [
  "conjunto_mesa_6_cadeiras.png",
  "Inserir um título (1).png",
  "Lulu Móveis & Design (1).png",
  "Lulu Móveis & Design.png"
];

// ------------------ Utilidades UI ------------------
function setAuthUI(user) {
  if (user) {
    // usuário logado
    document.body.classList.add('logged-in');
    sendBtn.disabled = false;
    // Exibir email/nome se quiser (ex: elemento #userEmail)
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = user.email;
  } else {
    // usuário saiu
    document.body.classList.remove('logged-in');
    sendBtn.disabled = true;
    messagesDiv.innerHTML = '';
    contactsListDiv.innerHTML = '';
  }
}

// limpa listeners ativos
function cleanupListeners() {
  if (typeof messagesUnsubscribe === 'function') { messagesUnsubscribe(); messagesUnsubscribe = null; }
  if (typeof contactsUnsubscribe === 'function') { contactsUnsubscribe(); contactsUnsubscribe = null; }
}

// ------------------ Auth persistence e onAuthStateChanged ------------------
(async function ensurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.warn("Não foi possível setar persistence:", err);
  }
})();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  setAuthUI(user);

  // sempre limpar listeners antigos primeiro
  cleanupListeners();

  if (user) {
    // iniciar listeners
    listenMessages();
    listenContacts();
  }
});

// ------------------ Render / addMessage ------------------
function addMessage(msg = {}, id = null) {
  const fromUser = msg.uid === currentUser?.uid;
  const msgDiv = document.createElement('div');
  msgDiv.className = fromUser ? 'message sent' : 'message received';
  msgDiv.style.display = 'flex';
  msgDiv.style.flexDirection = 'column';
  msgDiv.style.gap = '6px';
  msgDiv.style.margin = '6px';
  msgDiv.style.maxWidth = '70%';
  msgDiv.style.padding = '10px';
  msgDiv.style.borderRadius = '12px';
  msgDiv.style.background = fromUser ? '#05635f' : '#eee';
  msgDiv.style.color = fromUser ? '#fff' : '#000';
  msgDiv.dataset.id = id || '';

  // conteúdo: imagem se houver
  if (msg.fileName) {
    const img = document.createElement('img');
    if (HOSTING_IMAGES.includes(msg.fileName)) {
      img.src = `https://memofuturo.web.app/assets/images/${msg.fileName}`;
    } else {
      // fallback: se tiver url no doc (ex: msg.fileUrl), usar
      img.src = msg.fileUrl || '';
    }
    img.alt = msg.fileName || 'Imagem';
    img.style.maxWidth = '220px';
    img.style.borderRadius = '8px';
    img.style.objectFit = 'cover';
    msgDiv.appendChild(img);
  }

  if (msg.text) {
    const p = document.createElement('p');
    p.textContent = msg.text;
    p.style.margin = 0;
    msgDiv.appendChild(p);
  }

  // actions bar
  const actionsDiv = document.createElement('div');
  actionsDiv.style.display = 'flex';
  actionsDiv.style.alignItems = 'center';
  actionsDiv.style.gap = '6px';
  actionsDiv.style.marginTop = '6px';

  // like button
  const likeBtn = document.createElement('button');
  likeBtn.textContent = `❤️ ${msg.likes || 0}`;
  likeBtn.style.cursor = 'pointer';
  likeBtn.addEventListener('click', async () => {
    if (!id) return;
    try {
      const msgRef = doc(db, "messages", id);
      await updateDoc(msgRef, { likes: (msg.likes || 0) + 1 });
    } catch (err) {
      console.error("Erro ao curtir:", err);
      alert("Erro ao curtir mensagem.");
    }
  });
  actionsDiv.appendChild(likeBtn);

  // delete (apenas autor)
  if (fromUser) {
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.style.cursor = 'pointer';
    delBtn.addEventListener('click', async () => {
      if (!id) return;
      try {
        const msgRef = doc(db, "messages", id);
        await deleteDoc(msgRef);
      } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro ao deletar mensagem.");
      }
    });
    actionsDiv.appendChild(delBtn);

    const seenSpan = document.createElement('span');
    seenSpan.textContent = msg.seen ? '✔✔' : '✔';
    actionsDiv.appendChild(seenSpan);
  }

  msgDiv.appendChild(actionsDiv);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ------------------ Listen Messages ------------------
function listenMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  messagesUnsubscribe = onSnapshot(q, async (snapshot) => {
    messagesDiv.innerHTML = '';
    const batchPromises = [];

    snapshot.forEach(docItem => {
      const msgData = docItem.data();
      addMessage(msgData, docItem.id);

      // marca como seen quando não é do usuário atual e não foi visto
      if (msgData.uid !== currentUser?.uid && !msgData.seen) {
        const msgRef = doc(db, "messages", docItem.id);
        batchPromises.push(updateDoc(msgRef, { seen: true }));
      }
    });

    // atualiza flags seen em lote (async)
    if (batchPromises.length) {
      try { await Promise.all(batchPromises); } catch (err) { console.warn("Erro atualizando seen:", err); }
    }
  }, (err) => {
    console.error("Erro ao ouvir mensagens:", err);
  });
}

// ------------------ Send Message ------------------
async function sendMessage(text) {
  if (!currentUser) return alert("Faça login primeiro!");
  try {
    await addDoc(collection(db, "messages"), {
      text: text || '',
      uid: currentUser.uid,
      email: currentUser.email,
      timestamp: serverTimestamp(),
      likes: 0,
      seen: false
    });
    msgInput.value = '';
    sendBtn.disabled = true;
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    alert("Erro ao enviar mensagem.");
  }
}

// ------------------ Events: send ------------------
sendBtn?.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (text) sendMessage(text);
});

msgInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});
msgInput?.addEventListener('input', () => {
  sendBtn.disabled = msgInput.value.trim() === '';
});

// ------------------ Upload de arquivos (whitelist-only) ------------------
uploadBtn?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length || !currentUser) return alert("Faça login primeiro!");
  previewDiv.innerHTML = '';

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = '100px';
      img.style.margin = '5px';
      previewDiv.appendChild(img);
    }

    if (HOSTING_IMAGES.includes(file.name)) {
      try {
        await addDoc(collection(db, 'messages'), {
          text: '',
          fileName: file.name,
          uid: currentUser.uid,
          email: currentUser.email,
          timestamp: serverTimestamp(),
          likes: 0,
          seen: false
        });
      } catch (err) {
        console.error("Erro ao enviar arquivo:", err);
        alert("Erro ao enviar arquivo.");
      }
    } else {
      alert("Arquivo não permitido. Use apenas imagens já hospedadas (whitelist).");
    }
  }

  fileInput.value = '';
});

// ------------------ Contatos ------------------
function renderContacts(snapshot) {
  contactsListDiv.innerHTML = '';
  snapshot.forEach(docItem => {
    const contact = docItem.data();
    const contactDiv = document.createElement('div');
    contactDiv.textContent = contact.email;
    contactDiv.className = 'contact-item';
    contactDiv.style.padding = '6px';
    contactDiv.style.borderBottom = '1px solid #ddd';
    contactsListDiv.appendChild(contactDiv);
  });
}

function listenContacts() {
  if (!currentUser) return;
  const contactsRef = collection(db, "users", currentUser.uid, "contacts");
  contactsUnsubscribe = onSnapshot(contactsRef, (snapshot) => renderContacts(snapshot), (err) => {
    console.error("Erro ao ouvir contatos:", err);
  });
}

async function addContact(email) {
  if (!currentUser) return alert("Faça login primeiro!");
  try {
    const contactsRef = collection(db, "users", currentUser.uid, "contacts");
    await addDoc(contactsRef, { email, addedAt: serverTimestamp() });
    addContactInput.value = '';
    alert("Contato adicionado!");
    // listenContacts já está ativo via onAuthStateChanged
  } catch (err) {
    alert("Erro ao adicionar contato: " + (err.message || err));
  }
}

addContactBtn?.addEventListener('click', () => {
  const email = addContactInput.value.trim();
  if (email) addContact(email);
});

// ------------------ Login / Registro ------------------
loginBtn?.addEventListener('click', async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();
  if (!email || !password) return alert("Preencha email e senha!");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert(`Bem-vindo, ${email}`);
    // onAuthStateChanged cuidará do resto
  } catch (err) {
    console.error("Erro no login:", err);
    alert("Erro no login: " + (err.message || err));
  }
});

registerBtn?.addEventListener('click', async () => {
  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value.trim();
  if (!email || !password) return alert("Preencha email e senha!");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // user estará disponível via onAuthStateChanged; mensagem opcional:
    alert(`Conta criada: ${email} (você está logado)`);
  } catch (err) {
    console.error("Erro ao registrar:", err);
    alert("Erro ao registrar: " + (err.message || err));
  }
});

// ------------------ Logout (opcional) ------------------
logoutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    cleanupListeners();
    alert("Você saiu.");
  } catch (err) {
    console.error("Erro ao deslogar:", err);
    alert("Erro ao sair.");
  }
});

// ------------------ Atualizações de Perfil / Email / Senha / Verificação / Reset ------------------
updateProfileBtn?.addEventListener('click', async () => {
  if (!currentUser) return alert("Faça login primeiro!");
  const displayName = prompt("Digite novo nome:");
  if (displayName) {
    try {
      await fbUpdateProfile(currentUser, { displayName });
      alert("Nome atualizado.");
    } catch (err) {
      console.error("Erro updateProfile:", err);
      alert("Erro ao atualizar perfil.");
    }
  }
});

updateEmailBtn?.addEventListener('click', async () => {
  if (!currentUser) return alert("Faça login primeiro!");
  const newEmail = prompt("Digite novo email:");
  if (newEmail) {
    try {
      await fbUpdateEmail(currentUser, newEmail);
      alert("Email atualizado.");
    } catch (err) {
      console.error("Erro updateEmail:", err);
      alert("Erro ao atualizar email: " + (err.message || err));
    }
  }
});

updatePasswordBtn?.addEventListener('click', async () => {
  if (!currentUser) return alert("Faça login primeiro!");
  const newPass = prompt("Digite nova senha:");
  if (newPass) {
    try {
      await fbUpdatePassword(currentUser, newPass);
      alert("Senha atualizada.");
    } catch (err) {
      console.error("Erro updatePassword:", err);
      alert("Erro ao atualizar senha: " + (err.message || err));
    }
  }
});

sendVerificationBtn?.addEventListener('click', async () => {
  if (!currentUser) return alert("Faça login primeiro!");
  try {
    await sendEmailVerification(currentUser);
    alert("Email de verificação enviado.");
  } catch (err) {
    console.error("Erro sendEmailVerification:", err);
    alert("Erro ao enviar verificação.");
  }
});

resetPasswordBtn?.addEventListener('click', async () => {
  const email = prompt("Digite seu email para resetar a senha:");
  if (email) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de reset enviado.");
    } catch (err) {
      console.error("Erro sendPasswordResetEmail:", err);
      alert("Erro ao enviar email de reset: " + (err.message || err));
    }
  }
});

// ------------------ Nova Conversa (navegar para contacts.html) ------------------
newChatBtn?.addEventListener('click', () => {
  window.location.href = "contacts.html";
});

// ------------------ MAPA ------------------
window.addEventListener('DOMContentLoaded', () => {
  try { initMap(); } catch (err) { console.warn("initMap falhou:", err); }
});

openMapBtn?.addEventListener('click', () => {
  if (!mapModal) return;
  mapModal.style.display = 'block';
  const address = prompt("Digite o endereço para localizar no mapa:");
  if (address) {
    try { goToAddress(address); } catch (err) { console.warn("goToAddress erro:", err); }
  }
  setTimeout(() => {
    if (window.map && typeof window.map.invalidateSize === 'function') window.map.invalidateSize();
  }, 100);
});

closeMapModal?.addEventListener('click', () => mapModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === mapModal) mapModal.style.display = 'none'; });


export { loadChatMessages, sendMessage };


/* FIM do script */

