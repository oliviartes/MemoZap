// ---------------- IMPORTS ----------------
import { auth, db, analytics } from './firebaseConfig.js';
import { listenContacts, addContact } from './contacts.js';
import { uploadFile } from './upload.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// ---------------- ELEMENTOS DOM ----------------
const contactsContainer = document.getElementById("contactsList");
const addContactBtn = document.getElementById("addContactBtn");
const addContactInput = document.getElementById("addContactInput");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

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

// ---------------- VARIÁVEIS ----------------
let currentUser = null;
let selectedContactEmail = null;

// ---------------- CONTATOS ----------------
listenContacts(contactsContainer, (contact) => {
    selectedContactEmail = contact.email;
    document.getElementById('activeName').textContent = contact.displayName || contact.email;
    document.getElementById('activeStatus').textContent = 'Online';
});

addContactBtn.addEventListener("click", () => {
    const email = addContactInput.value.trim();
    if (email) {
        addContact(email);
        addContactInput.value = "";
        logEvent(analytics, 'add_contact', { email });
        alert(`Contato ${email} adicionado!`);
    }
});

// ---------------- UPLOAD ----------------
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!selectedContactEmail) return alert("Selecione um contato antes de enviar o arquivo!");
    if (file) {
        uploadFile(selectedContactEmail, file);
        logEvent(analytics, 'upload_file', { to: selectedContactEmail, fileName: file.name });
        alert(`Arquivo ${file.name} enviado para ${selectedContactEmail}!`);
    }
});

// ---------------- MENSAGENS ----------------
function addMessage(text, from = 'user') {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.margin = '5px 0';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '15px';
    msg.style.maxWidth = '60%';
    msg.style.wordWrap = 'break-word';
    msg.style.alignSelf = from === 'user' ? 'flex-end' : 'flex-start';
    msg.style.background = from === 'user' ? '#05635f' : '#ccc';
    msg.style.color = from === 'user' ? '#fff' : '#000';
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(text) {
    if (!currentUser) return alert("Faça login primeiro!");
    if (!selectedContactEmail) return alert("Selecione um contato para enviar a mensagem!");
    try {
        await addDoc(collection(db, "messages"), {
            text,
            uid: currentUser.uid,
            email: currentUser.email,
            toEmail: selectedContactEmail,
            timestamp: serverTimestamp()
        });
        logEvent(analytics, 'send_message', { to: selectedContactEmail, textLength: text.length });
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
}

function listenMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(doc => {
            const msgData = doc.data();
            if (!currentUser) return;
            if(msgData.toEmail === currentUser.email || msgData.email === currentUser.email) {
                addMessage(msgData.text, msgData.uid === currentUser.uid ? 'user' : 'bot');
            }
        });
    });
}

sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if (text !== '') {
        await sendMessage(text);
        msgInput.value = '';
    }
});
msgInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
msgInput.addEventListener('input', () => { sendBtn.disabled = msgInput.value.trim() === ''; });

// ---------------- AUTENTICAÇÃO ----------------
loginBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Bem-vindo, ${currentUser.email}`);
        listenMessages();
        logEvent(analytics, 'login', { method: 'email', email: currentUser.email });
    } catch(err) {
        alert("Erro no login: " + err.message);
    }
});

registerBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Cadastro com sucesso: ${currentUser.email}`);
        listenMessages();
        logEvent(analytics, 'sign_up', { method: 'email', email: currentUser.email });
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
});

updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
        logEvent(analytics, 'update_profile', { email: currentUser.email });
    } catch(err) { alert(err.message); }
});

updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
        logEvent(analytics, 'update_email', { oldEmail: currentUser.email, newEmail });
    } catch(err) { alert(err.message); }
});

updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
        logEvent(analytics, 'update_password', { email: currentUser.email });
    } catch(err) { alert(err.message); }
});

sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
        logEvent(analytics, 'send_verification', { email: currentUser.email });
    } catch(err) { alert(err.message); }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email de redefinição enviado!");
        logEvent(analytics, 'reset_password', { email });
    } catch(err) { alert(err.message); }
});
