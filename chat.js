import { auth, db } from './firebaseConfig.js';
import { listenContacts, addContact } from './contacts.js';
import { uploadFile } from './upload.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// ------------------ ELEMENTOS ------------------
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

let currentUser = null;
let selectedContactEmail = null;

// ------------------ CONTATOS ------------------
listenContacts(contactsContainer, (contact) => {
    console.log("Contato selecionado:", contact);
    selectedContactEmail = contact.email;
});

addContactBtn.addEventListener("click", () => {
    const email = addContactInput.value.trim();
    if (email) {
        addContact(email);
        addContactInput.value = "";
    }
});

// ------------------ UPLOAD ------------------
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && selectedContactEmail) {
        uploadFile(selectedContactEmail, file);
    } else {
        console.warn("Nenhum contato selecionado ou arquivo inválido.");
    }
});

// ------------------ MENSAGENS ------------------
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
    try {
        await addDoc(collection(db, "messages"), {
            text,
            uid: currentUser.uid,
            email: currentUser.email,
            timestamp: serverTimestamp()
        });
    } catch (err) { console.error(err); }
}

function listenMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(doc => {
            const msgData = doc.data();
            addMessage(msgData.text, msgData.uid === currentUser?.uid ? 'user' : 'bot');
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

// ------------------ AUTENTICAÇÃO ------------------
loginBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Bem-vindo, ${currentUser.email}`);
        listenMessages();
    } catch(err) { alert("Erro no login: " + err.message); }
});

registerBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Conta criada: ${currentUser.email}`);
        listenMessages();
    } catch(err) { alert("Erro ao registrar: " + err.message); }
});

updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    try { await updateProfile(currentUser, { displayName }); alert("Perfil atualizado!"); }
    catch(err) { alert(err.message); }
});

updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    try { await updateEmail(currentUser, newEmail); alert("Email atualizado!"); }
    catch(err) { alert(err.message); }
});

updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    try { await updatePassword(currentUser, newPass); alert("Senha atualizada!"); }
    catch(err) { alert(err.message); }
});

sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try { await sendEmailVerification(currentUser); alert("Email de verificação enviado!"); }
    catch(err) { alert(err.message); }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    try { await auth.sendPasswordResetEmail(email); alert("Email enviado!"); }
    catch(err) { alert(err.message); }
});
