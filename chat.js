import { auth, db, storage } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword,
    signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { 
    ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// ------------------ DOM ELEMENTOS ------------------
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

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

let currentUser = null;

// ------------------ FUNÇÕES ------------------

function addMessage(content, from = 'user', type = 'text') {
    const msg = document.createElement('div');
    msg.style.margin = '5px 0';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '15px';
    msg.style.maxWidth = '60%';
    msg.style.wordWrap = 'break-word';
    msg.style.display = 'flex';
    msg.style.flexDirection = 'column';
    msg.style.alignItems = from === 'user' ? 'flex-end' : 'flex-start';
    msg.style.alignSelf = from === 'user' ? 'flex-end' : 'flex-start';

    if (type === 'image') {
        const img = document.createElement('img');
        img.src = content;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '10px';
        msg.appendChild(img);
    } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = content;
        video.controls = true;
        video.style.maxWidth = '200px';
        msg.appendChild(video);
    } else {
        const textDiv = document.createElement('div');
        textDiv.textContent = content;
        msg.appendChild(textDiv);
    }

    if (from === 'user') {
        msg.style.background = '#05635f';
        msg.style.color = 'white';
    } else {
        msg.style.background = '#ccc';
        msg.style.color = '#000';
    }

    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(content, type = 'text') {
    if (!currentUser) return alert("Faça login primeiro!");
    try {
        await addDoc(collection(db, "messages"), {
            content,
            type,
            uid: currentUser.uid,
            email: currentUser.email,
            timestamp: serverTimestamp()
        });
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
            addMessage(
                msgData.content,
                msgData.uid === currentUser?.uid ? 'user' : 'bot',
                msgData.type || 'text'
            );
        });
    });
}

// ------------------ UPLOAD DE ARQUIVOS ------------------

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = ref(storage, `uploads/${Date.now()}-${file.name}`);

    try {
        await uploadBytes(fileRef, file);
        const fileURL = await getDownloadURL(fileRef);

        const fileType = file.type.startsWith('image/') ? 'image' :
                         file.type.startsWith('video/') ? 'video' : 'text';

        await sendMessage(fileURL, fileType);
        addMessage(fileURL, 'user', fileType);

        console.log("Arquivo enviado:", fileURL);
    } catch (err) {
        alert("Erro ao enviar arquivo: " + err.message);
        console.error(err);
    }
});

// ------------------ EVENTOS ------------------

msgInput.addEventListener('input', () => {
    sendBtn.disabled = msgInput.value.trim() === '';
});

sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if (text !== '') {
        await sendMessage(text, 'text');
        msgInput.value = '';
        sendBtn.disabled = true;
    }
});

msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// ------------------ AUTENTICAÇÃO ------------------

loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!email || !password) return alert("Preencha email e senha!");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Bem-vindo, ${currentUser.email}`);
        sendBtn.disabled = false;
        listenMessages();
    } catch (err) {
        alert("Erro no login: " + err.message);
    }
});

registerBtn.addEventListener('click', async () => {
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if (!email || !password) return alert("Preencha email e senha!");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Conta criada com sucesso: ${currentUser.email}`);
        sendBtn.disabled = false;
        listenMessages();
    } catch (err) {
        alert("Erro ao registrar: " + err.message);
    }
});

updateProfileBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    if (!displayName) return;
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
    } catch (err) {
        alert(err.message);
    }
});

updateEmailBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    if (!newEmail) return;
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
    } catch (err) {
        alert(err.message);
    }
});

updatePasswordBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    if (!newPass) return;
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
    } catch (err) {
        alert(err.message);
    }
});

sendVerificationBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch (err) {
        alert(err.message);
    }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    if (!email) return;
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email de redefinição enviado!");
    } catch (err) {
        alert(err.message);
    }
});
