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

// ------------------ DOM ------------------
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

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
let selectedFile = null;

// ------------------ Funções ------------------

function addMessage(text, from = 'user', fileUrl = null) {
    const msgContainer = document.createElement('div');
    msgContainer.style.display = 'flex';
    msgContainer.style.flexDirection = 'column';
    msgContainer.style.alignItems = from === 'user' ? 'flex-end' : 'flex-start';
    msgContainer.style.margin = '5px 0';

    // Texto da mensagem
    if (text) {
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.padding = '8px 12px';
        msg.style.borderRadius = '15px';
        msg.style.maxWidth = '60%';
        msg.style.wordWrap = 'break-word';
        msg.style.background = from === 'user' ? '#05635f' : '#ccc';
        msg.style.color = from === 'user' ? 'white' : 'black';
        msgContainer.appendChild(msg);
    }

    // Se houver arquivo, adiciona
    if (fileUrl) {
        let media;
        if (fileUrl.match(/\.(mp4|webm|ogg)$/i)) {
            media = document.createElement('video');
            media.controls = true;
        } else {
            media = document.createElement('img');
        }
        media.src = fileUrl;
        media.style.maxWidth = '200px';
        media.style.borderRadius = '10px';
        media.style.marginTop = '5px';
        msgContainer.appendChild(media);
    }

    messagesDiv.appendChild(msgContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(text) {
    if (!currentUser) return alert("Faça login primeiro!");

    let fileUrl = null;

    // Envia o arquivo, se houver
    if (selectedFile) {
        const fileRef = ref(storage, `uploads/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(fileRef);
        selectedFile = null;
        fileInput.value = '';
    }

    try {
        await addDoc(collection(db, "messages"), {
            text,
            fileUrl,
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
                msgData.text || '',
                msgData.uid === currentUser?.uid ? 'user' : 'bot',
                msgData.fileUrl || null
            );
        });
    });
}

// ------------------ Eventos ------------------

// Upload de arquivo
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files[0];
    if (selectedFile) {
        sendBtn.disabled = false;
        alert(`Arquivo selecionado: ${selectedFile.name}`);
    }
});

// Habilitar botão enviar ao digitar texto
msgInput.addEventListener('input', () => {
    sendBtn.disabled = !msgInput.value.trim() && !selectedFile;
});

// Enviar mensagem
sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if (text || selectedFile) {
        await sendMessage(text);
        msgInput.value = '';
        sendBtn.disabled = true;
    }
});
msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Login
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

// Registrar
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

// Atualizar perfil
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

// Atualizar email
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

// Atualizar senha
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

// Enviar verificação
sendVerificationBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch (err) {
        alert(err.message);
    }
});

// Resetar senha
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
