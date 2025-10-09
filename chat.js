// ------------------ chat.js ------------------
import { auth, db } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword,
    signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { uploadFile } from "./upload.js"; // ✅ Import do upload

// ------------------ DOM ------------------
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

let currentUser = null;

// ------------------ Funções ------------------

function addMessage(text, from = 'user', id = null, likes = 0, seen = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-item';
    msgDiv.style.margin = '5px 0';
    msgDiv.style.padding = '8px 12px';
    msgDiv.style.borderRadius = '15px';
    msgDiv.style.maxWidth = '60%';
    msgDiv.style.wordWrap = 'break-word';
    msgDiv.style.display = 'flex';
    msgDiv.style.alignItems = 'center';
    msgDiv.style.justifyContent = 'space-between';
    msgDiv.style.background = from === 'user' ? '#05635f' : '#ccc';
    msgDiv.style.color = from === 'user' ? 'white' : '#000';

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.flex = '1';
    msgDiv.appendChild(textSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '5px';

    const likeBtn = document.createElement('button');
    likeBtn.textContent = `❤️ ${likes}`;
    likeBtn.style.cursor = 'pointer';
    likeBtn.addEventListener('click', async () => {
        if(!id) return;
        const msgRef = doc(db, "messages", id);
        await updateDoc(msgRef, { likes: likes + 1 });
    });
    actionsDiv.appendChild(likeBtn);

    if(from === 'user') {
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.style.cursor = 'pointer';
        delBtn.addEventListener('click', async () => {
            if(!id) return;
            const msgRef = doc(db, "messages", id);
            await deleteDoc(msgRef);
        });
        actionsDiv.appendChild(delBtn);

        const seenSpan = document.createElement('span');
        seenSpan.textContent = seen ? '✔✔' : '✔';
        seenSpan.style.marginLeft = '5px';
        actionsDiv.appendChild(seenSpan);
    }

    msgDiv.appendChild(actionsDiv);
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(text) {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await addDoc(collection(db, "messages"), {
            text,
            uid: currentUser.uid,
            email: currentUser.email,
            timestamp: serverTimestamp(),
            likes: 0,
            seen: false
        });
        msgInput.value = '';
        sendBtn.disabled = true;
    } catch(err) {
        console.error("Erro ao enviar mensagem:", err);
    }
}

function listenMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(async docItem => {
            const msgData = docItem.data();
            const isUser = msgData.uid === currentUser?.uid;
            addMessage(
                msgData.text,
                isUser ? 'user' : 'bot',
                docItem.id,
                msgData.likes || 0,
                msgData.seen || false
            );

            if(!isUser && !msgData.seen) {
                const msgRef = doc(db, "messages", docItem.id);
                await updateDoc(msgRef, { seen: true });
            }
        });
    });
}

// ------------------ Contatos ------------------

function renderContacts(snapshot) {
    contactsListDiv.innerHTML = '';
    snapshot.forEach(doc => {
        const contact = doc.data();
        const contactDiv = document.createElement('div');
        contactDiv.textContent = contact.email;
        contactDiv.className = 'contact-item';
        contactsListDiv.appendChild(contactDiv);
    });
}

function listenContacts() {
    if(!currentUser) return;
    const contactsRef = collection(db, "users", currentUser.uid, "contacts");
    onSnapshot(contactsRef, snapshot => {
        renderContacts(snapshot);
    });
}

async function addContact(email) {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        const contactsRef = collection(db, "users", currentUser.uid, "contacts");
        await addDoc(contactsRef, { 
            email, 
            addedAt: serverTimestamp() 
        });
        addContactInput.value = '';
        alert("Contato adicionado com sucesso!");
        listenContacts();
    } catch(err) {
        console.error("Erro ao adicionar contato:", err);
        alert("Erro ao adicionar contato: " + err.message);
    }
}

// ------------------ Eventos ------------------

// Habilitar botão de enviar ao digitar
msgInput.addEventListener('input', () => {
    sendBtn.disabled = msgInput.value.trim() === '';
});

// Enviar mensagem
sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if(text !== '') {
        await sendMessage(text);
        msgInput.value = '';
        sendBtn.disabled = true;
    }
});
msgInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendBtn.click();
});

// ------------------ Upload via upload.js ------------------
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const activeContactEmail = document.getElementById("activeName")?.textContent || null;

  await uploadFile(activeContactEmail, file);

  fileInput.value = "";
});

// ------------------ Login / Registro ------------------

// Login
loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if(!email || !password) return alert("Preencha email e senha!");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Bem-vindo, ${currentUser.email}`);
        sendBtn.disabled = false;
        listenMessages();
        listenContacts();
    } catch(err) {
        alert("Erro no login: " + err.message);
    }
});

// Registrar
registerBtn.addEventListener('click', async () => {
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if(!email || !password) return alert("Preencha email e senha!");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Conta criada com sucesso: ${currentUser.email}`);
        sendBtn.disabled = false;
        listenMessages();
        listenContacts();
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
});

// ------------------ Atualizações de Perfil ------------------

updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    if(!displayName) return;
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
    } catch(err) {
        alert(err.message);
    }
});

updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    if(!newEmail) return;
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
    } catch(err) {
        alert(err.message);
    }
});

updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    if(!newPass) return;
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
    } catch(err) {
        alert(err.message);
    }
});

sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch(err) {
        alert(err.message);
    }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    if(!email) return;
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email de redefinição enviado!");
    } catch(err) {
        alert(err.message);
    }
});
