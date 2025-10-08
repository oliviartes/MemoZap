// chat.js
import { auth, db } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Elementos do DOM
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const addContactBtn = document.getElementById('addContactBtn');
const updateProfileBtn = document.getElementById('updateProfileBtn');
const updateEmailBtn = document.getElementById('updateEmailBtn');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const sendVerificationBtn = document.getElementById('sendVerificationBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

let currentUser = null;

// ------------------ Funções ------------------

// Mostrar mensagem no chat
function addMessage(text, from = 'user') {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.margin = '5px 0';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '15px';
    msg.style.maxWidth = '60%';
    msg.style.wordWrap = 'break-word';

    if(from === 'user') {
        msg.style.background = '#05635f';
        msg.style.color = 'white';
        msg.style.alignSelf = 'flex-end';
    } else {
        msg.style.background = '#ccc';
        msg.style.color = '#000';
        msg.style.alignSelf = 'flex-start';
    }

    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Enviar mensagem para Firestore
async function sendMessage(text) {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await addDoc(collection(db, "messages"), {
            text,
            uid: currentUser.uid,
            email: currentUser.email,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
}

// Ouvir mensagens em tempo real
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

// ------------------ Eventos ------------------

// Enviar mensagem
sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if(text !== '') {
        await sendMessage(text);
        msgInput.value = '';
    }
});
msgInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendBtn.click();
});

// Login
loginBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Bem-vindo, ${currentUser.email}`);
        listenMessages();
    } catch(err) {
        alert("Erro no login: " + err.message);
    }
});

// Registrar
registerBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email:");
    const password = prompt("Digite sua senha:");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Conta criada com sucesso: ${currentUser.email}`);
        listenMessages();
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
});

// Atualizar perfil
updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
    } catch(err) {
        alert(err.message);
    }
});

// Atualizar email
updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
    } catch(err) {
        alert(err.message);
    }
});

// Atualizar senha
updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
    } catch(err) {
        alert(err.message);
    }
});

// Enviar verificação de email
sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch(err) {
        alert(err.message);
    }
});

// Resetar senha
resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    try {
        await auth.sendPasswordResetEmail(email);
        alert("Email de redefinição enviado!");
    } catch(err) {
        alert(err.message);
    }
});
