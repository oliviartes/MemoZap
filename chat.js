// chat.js
import { auth, db, storage } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// DOM
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerBtn = document.getElementById('registerBtn');

const updateProfileBtn = document.getElementById('updateProfileBtn');
const updateEmailBtn = document.getElementById('updateEmailBtn');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const sendVerificationBtn = document.getElementById('sendVerificationBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

// NOVOS ELEMENTOS
const addContactBtn = document.getElementById('addContactBtn');
const addContactInput = document.getElementById('addContactInput');

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

let currentUser = null;

// ---------------- Funções ----------------
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
    } catch(err) { console.error(err); }
}

function listenMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(doc => {
            const msg = doc.data();
            addMessage(msg.text, msg.uid === currentUser?.uid ? 'user' : 'bot');
        });
    });
}

// ---------------- Eventos ----------------
sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if(text !== '') {
        await sendMessage(text);
        msgInput.value = '';
    }
});
msgInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendBtn.click(); });

// Login
loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if(!email || !password) return alert("Preencha email e senha!");
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
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    if(!email || !password) return alert("Preencha email e senha!");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        alert(`Conta criada: ${currentUser.email}`);
        listenMessages();
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
});

// Atualizar perfil
updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    if(!displayName) return;
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
    } catch(err) { alert(err.message); }
});

// Atualizar email
updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    if(!newEmail) return;
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
    } catch(err) { alert(err.message); }
});

// Atualizar senha
updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    if(!newPass) return;
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
    } catch(err) { alert(err.message); }
});

// Enviar verificação
sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch(err) { alert(err.message); }
});

// Resetar senha
resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    if(!email) return;
    try {
        await auth.sendPasswordResetEmail(email);
        alert("Email de redefinição enviado!");
    } catch(err) { alert(err.message); }
});

// ---------------- NOVOS BOTÕES ----------------

// Adicionar contato
addContactBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const contactEmail = addContactInput.value.trim();
    if(!contactEmail) return alert("Digite o email do contato");

    try {
        const q = query(collection(db, 'usuarios'), where('email', '==', contactEmail));
        const querySnapshot = await getDocs(q);
        if(querySnapshot.empty) return alert('Usuário não encontrado');

        await addDoc(collection(db, 'usuarios', currentUser.uid, 'contatos'), {
            email: contactEmail,
            addedAt: new Date()
        });
        alert('Contato adicionado com sucesso!');
        addContactInput.value = '';
    } catch(err) {
        console.error(err);
        alert('Erro ao adicionar contato');
    }
});

// Upload de fotos
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const file = fileInput.files[0];
    if(!file) return;

    try {
        const storageRef = ref(storage, `usuarios/${currentUser.uid}/${file.name}`);
        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);
        addMessage(`📷 Foto enviada: ${url}`, 'user');
        fileInput.value = '';
    } catch(err) {
        console.error(err);
        alert('Erro ao enviar foto');
    }
});
