// chat.js
import { auth, db } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc 
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
let currentChatContact = null;

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

// Enviar mensagem
async function sendMessage(text) {
    if(!currentUser) return alert("Faça login primeiro!");
    if(!currentChatContact) return alert("Selecione um contato!");

    try {
        await addDoc(collection(db, "messages"), {
            text,
            uidFrom: currentUser.uid,
            uidTo: currentChatContact.uid,
            emailFrom: currentUser.email,
            emailTo: currentChatContact.email,
            timestamp: serverTimestamp()
        });
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
}

// Ouvir mensagens
function listenMessages() {
    if(!currentUser || !currentChatContact) return;

    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(docSnap => {
            const msgData = docSnap.data();
            if(
                (msgData.uidFrom === currentUser.uid && msgData.uidTo === currentChatContact.uid) ||
                (msgData.uidFrom === currentChatContact.uid && msgData.uidTo === currentUser.uid)
            ) {
                addMessage(msgData.text, msgData.uidFrom === currentUser.uid ? 'user' : 'bot');
            }
        });
    });
}

// ------------------ Eventos ------------------

// Envio via botão ou Enter
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
        loadContacts();
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
        loadContacts();
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
});

// Atualizações de perfil/email/senha
updateProfileBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const displayName = prompt("Digite novo nome:");
    try {
        await updateProfile(currentUser, { displayName });
        alert("Perfil atualizado!");
    } catch(err) { alert(err.message); }
});

updateEmailBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newEmail = prompt("Digite novo email:");
    try {
        await updateEmail(currentUser, newEmail);
        alert("Email atualizado!");
    } catch(err) { alert(err.message); }
});

updatePasswordBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const newPass = prompt("Digite nova senha:");
    try {
        await updatePassword(currentUser, newPass);
        alert("Senha atualizada!");
    } catch(err) { alert(err.message); }
});

sendVerificationBtn.addEventListener('click', async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    try {
        await sendEmailVerification(currentUser);
        alert("Email de verificação enviado!");
    } catch(err) { alert(err.message); }
});

resetPasswordBtn.addEventListener('click', async () => {
    const email = prompt("Digite seu email para resetar a senha:");
    try { await auth.sendPasswordResetEmail(email); alert("Email enviado!"); }
    catch(err) { alert(err.message); }
});

// ------------------ Contatos estilizados ------------------

async function loadContacts() {
    const sidebar = document.querySelector('.sidebar');
    const oldContacts = document.querySelectorAll('.contact-item');
    oldContacts.forEach(c => c.remove());
    if (!currentUser) return;

    try {
        const contactsSnapshot = await getDocs(collection(db, "users", currentUser.uid, "contacts"));
        contactsSnapshot.forEach(docSnap => {
            const contact = docSnap.data();

            // Container do contato
            const div = document.createElement('div');
            div.className = 'contact-item';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '6px 10px';
            div.style.marginBottom = '5px';
            div.style.borderRadius = '8px';
            div.style.background = '#23a6a0';
            div.style.color = '#fff';
            div.style.cursor = 'pointer';
            div.style.transition = 'background 0.2s';
            div.onmouseover = () => div.style.background = '#1b8c87';
            div.onmouseout = () => div.style.background = '#23a6a0';

            // Avatar (iniciais)
            const avatar = document.createElement('div');
            avatar.textContent = contact.email.charAt(0).toUpperCase();
            avatar.style.width = '30px';
            avatar.style.height = '30px';
            avatar.style.borderRadius = '50%';
            avatar.style.background = '#fff';
            avatar.style.color = '#23a6a0';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.fontWeight = 'bold';
            avatar.style.marginRight = '10px';
            avatar.style.flexShrink = '0';

            // Nome
            const span = document.createElement('span');
            span.textContent = contact.email;
            span.style.flexGrow = '1';

            // Botão remover
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.style.background = '#ff4c4c';
            removeBtn.style.border = 'none';
            removeBtn.style.color = '#fff';
            removeBtn.style.borderRadius = '4px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '2px 6px';
            removeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if(!confirm(`Remover contato ${contact.email} e apagar chat?`)) return;
                try {
                    await deleteDoc(doc(db, "users", currentUser.uid, "contacts", docSnap.id));
                    const messagesSnapshot = await getDocs(collection(db, "messages"));
                    messagesSnapshot.forEach(async m => {
                        const mData = m.data();
                        if(
                            (mData.uidFrom === currentUser.uid && mData.uidTo === docSnap.id) ||
                            (mData.uidFrom === docSnap.id && mData.uidTo === currentUser.uid)
                        ) await deleteDoc(doc(db, "messages", m.id));
                    });
                    if(currentChatContact && currentChatContact.uid === docSnap.id) {
                        messagesDiv.innerHTML = '';
                        currentChatContact = null;
                    }
                    loadContacts();
                } catch(err) { console.error(err); alert("Erro ao remover contato."); }
            });

            div.appendChild(avatar);
            div.appendChild(span);
            div.appendChild(removeBtn);

            div.addEventListener('click', () => {
                currentChatContact = { uid: docSnap.id, email: contact.email };
                messagesDiv.innerHTML = '';
                listenMessages();
            });

            sidebar.insertBefore(div, addContactBtn.nextSibling);
        });
    } catch(err) { console.error(err); }
}

// Adicionar contato com input estilizado
addContactBtn.addEventListener('click', () => {
    if (!currentUser) return alert("Faça login primeiro!");
    if (document.getElementById('newContactInput')) return;

    const input = document.createElement('input');
    input.type = 'email';
    input.id = 'newContactInput';
    input.placeholder = 'Digite e-mail do contato';
    input.style.padding = '8px';
    input.style.marginBottom = '5px';
    input.style.borderRadius = '5px';
    input.style.border = '1px solid #ccc';
    input.style.fontSize = '14px';

    const sidebar = document.querySelector('.sidebar');
    sidebar.insertBefore(input, addContactBtn.nextSibling);
    input.focus();

    input.addEventListener('keypress', async (e) => {
        if(e.key === 'Enter') {
            const contactEmail = input.value.trim();
            if(!contactEmail) return alert("Digite um e-mail válido.");
            try {
                const docRef = await addDoc(collection(db, "users", currentUser.uid, "contacts"), {
                    email: contactEmail,
                    addedAt: serverTimestamp()
                });
                input.remove();
                loadContacts();
                currentChatContact = { uid: docRef.id, email: contactEmail };
                messagesDiv.innerHTML = '';
                listenMessages();
            } catch(err) { console.error(err); alert("Erro ao adicionar contato."); }
        }
    });
});
