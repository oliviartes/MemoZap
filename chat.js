import { uploadFile } from "./upload.js";

import { auth, db, storage } from './firebaseConfig.js';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, updateProfile, updateEmail, updatePassword,
  signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { 
  ref, uploadBytes, uploadBytesResumable, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";



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




// variável para manter o arquivo selecionado até o usuário apertar Enviar


// referência DOM (certifique-se que já existam)
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');



// habilita/desabilita botão enviar conforme houver texto ou arquivo
function updateSendButtonState() {
    const hasText = msgInput.value.trim() !== '';
    const hasFile = pendingFile !== null;
    sendBtn.disabled = !(hasText || hasFile);
}

msgInput.addEventListener('input', updateSendButtonState);

// abrir file picker
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// change apenas faz preview e guarda arquivo para envio posterior
fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    pendingFile = null;
    previewDiv.innerHTML = '';

    if (!file) {
        updateSendButtonState();
        return;
    }

    // somente imagens (opcional)
    if (!file.type.startsWith('image/')) {
        alert('Apenas imagens são permitidas.');
        fileInput.value = '';
        updateSendButtonState();
        return;
    }

    // preview
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.maxWidth = '100px';
    img.alt = file.name;
    previewDiv.appendChild(img);

    // guarda para envio quando o usuário clicar em "Enviar"
    pendingFile = file;
    updateSendButtonState();
});

// agora o sendBtn trata texto e/ou arquivo (upload + envio ao Firestore)
sendBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        alert('Faça login para enviar mensagens.');
        return;
    }

    const text = msgInput.value.trim();

    // se houver arquivo pendente, faz upload primeiro e obtém URL
    if (pendingFile) {
        const file = pendingFile;
        // caminho no storage
        const path = `messages/${user.uid}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file);

        // mostra progresso temporário
        const progressDiv = document.createElement('div');
        progressDiv.textContent = `Enviando ${file.name} (0%)`;
        messagesDiv.appendChild(progressDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // observa progresso
        uploadTask.on('state_changed', (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            progressDiv.textContent = `Enviando ${file.name} (${percent}%)`;
        }, (error) => {
            console.error('Erro upload:', error);
            alert('Erro ao enviar arquivo: ' + error.message);
            progressDiv.remove();
        });

        try {
            // aguarda finalização do upload (usa getDownloadURL sobre o mesmo fileRef)
            await new Promise((resolve, reject) => {
                uploadTask.then(resolve).catch(reject);
            });

            const url = await getDownloadURL(fileRef);

            // salva no Firestore (inclui texto junto, caso exista)
            await addDoc(collection(db, 'messages'), {
                text: text || '',                // se tiver texto, inclui junto
                fileName: file.name,
                fileType: file.type || 'image/*',
                fileSize: file.size,
                fileUrl: url,
                senderId: user.uid,
                senderName: user.displayName || 'Usuário',
                createdAt: serverTimestamp()
            });

            // limpeza UI
            setTimeout(() => progressDiv.remove(), 800);
            previewDiv.innerHTML = '';
            fileInput.value = '';
            pendingFile = null;
            msgInput.value = '';
            updateSendButtonState();

        } catch (err) {
            console.error('Erro finalizando upload:', err);
            alert('Erro finalizando upload: ' + (err.message || err));
            progressDiv.remove();
        }

        return; // já enviou (com ou sem texto)
    }

    // se não houver arquivo, envia apenas o texto
    if (text) {
        try {
            await addDoc(collection(db, 'messages'), {
                text,
                senderId: user.uid,
                senderName: user.displayName || 'Usuário',
                createdAt: serverTimestamp()
            });
            msgInput.value = '';
            updateSendButtonState();
        } catch (err) {
            console.error('Erro enviando texto:', err);
            alert('Erro ao enviar mensagem: ' + (err.message || err));
        }
    }
});









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

    // Botão curtir
    const likeBtn = document.createElement('button');
    likeBtn.textContent = `❤️ ${likes}`;
    likeBtn.style.cursor = 'pointer';
    likeBtn.addEventListener('click', async () => {
        if(!id) return;
        const msgRef = doc(db, "messages", id);
        await updateDoc(msgRef, { likes: likes + 1 });
    });
    actionsDiv.appendChild(likeBtn);

    // Botão apagar e status de visualização
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

            // Marcar como visualizada se for do outro usuário
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



// Adicionar contato
addContactBtn.addEventListener('click', () => {
    const email = addContactInput.value.trim();
    if(!email) return alert("Digite um email válido!");
    addContact(email);
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

// Atualizar perfil
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

// Atualizar email
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

// Atualizar senha
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
    if(!email) return;
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Email de redefinição enviado!");
    } catch(err) {
        alert(err.message);
    }
});
