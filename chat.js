// chat.js
import { auth, db, storage } from './firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendEmailVerification, updateProfile, updateEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// DOM Elements
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const addContactBtn = document.getElementById('addContactBtn');

let currentUser = null;
let currentChatContact = null;

// ------------------ Funções ------------------

// Adicionar mensagem ao chat
function addMessage(content, from = 'user', isImage = false, msgId = null, likes = []) {
    const msg = document.createElement('div');
    msg.style.margin = '5px 0';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '15px';
    msg.style.maxWidth = '60%';
    msg.style.wordWrap = 'break-word';
    msg.style.display = 'flex';
    msg.style.flexDirection = 'column';
    msg.style.transition = '0.2s all';
    msg.style.position = 'relative';

    if(from === 'user') {
        msg.style.background = '#05635f';
        msg.style.color = 'white';
        msg.style.alignSelf = 'flex-end';
    } else {
        msg.style.background = '#ccc';
        msg.style.color = '#000';
        msg.style.alignSelf = 'flex-start';
    }

    if(isImage) {
        const img = document.createElement('img');
        img.src = content;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '10px';
        img.style.marginTop = '5px';
        msg.appendChild(img);
    } else {
        msg.textContent = content;
    }

    // Botão de curtir/descurtir
    const likeBtn = document.createElement('button');
    const isLiked = likes.includes(currentUser?.uid);
    likeBtn.textContent = `👍 ${likes.length}`;
    likeBtn.style.fontSize = '14px';
    likeBtn.style.background = 'transparent';
    likeBtn.style.border = 'none';
    likeBtn.style.color = from === 'user' ? '#fff' : '#000';
    likeBtn.style.cursor = 'pointer';
    likeBtn.style.alignSelf = 'flex-end';
    likeBtn.style.marginTop = '5px';
    likeBtn.style.fontWeight = isLiked ? 'bold' : 'normal';

    likeBtn.addEventListener('click', async () => {
        if(!msgId) return;
        try {
            const msgRef = doc(db, 'messages', msgId);
            if(isLiked) {
                await updateDoc(msgRef, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(msgRef, { likes: arrayUnion(currentUser.uid) });
            }
        } catch(err) {
            console.error("Erro ao curtir/descurtir mensagem:", err);
        }
    });

    msg.appendChild(likeBtn);

    messagesDiv.appendChild(msg);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
}

// Enviar mensagem de texto
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
            type: 'text',
            timestamp: serverTimestamp(),
            likes: []
        });
    } catch(err) { console.error(err); }
}

// Enviar imagem
async function sendImage(file) {
    if(!currentUser || !currentChatContact) return;
    const storageRef = ref(storage, `images/${currentUser.uid}_${Date.now()}_${file.name}`);
    try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, "messages"), {
            imageUrl: url,
            uidFrom: currentUser.uid,
            uidTo: currentChatContact.uid,
            emailFrom: currentUser.email,
            emailTo: currentChatContact.email,
            type: 'image',
            timestamp: serverTimestamp(),
            likes: []
        });
    } catch(err) { console.error(err); }
}

// Ouvir mensagens
function listenMessages() {
    if(!currentUser || !currentChatContact) return;
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, snapshot => {
        messagesDiv.innerHTML = '';
        snapshot.forEach(docSnap => {
            const msgData = docSnap.data();
            if(
                (msgData.uidFrom === currentUser.uid && msgData.uidTo === currentChatContact.uid) ||
                (msgData.uidFrom === currentChatContact.uid && msgData.uidTo === currentUser.uid)
            ) {
                const likesArray = msgData.likes || [];
                if(msgData.type === 'image') {
                    addMessage(msgData.imageUrl, msgData.uidFrom === currentUser.uid ? 'user' : 'bot', true, docSnap.id, likesArray);
                } else {
                    addMessage(msgData.text, msgData.uidFrom === currentUser.uid ? 'user' : 'bot', false, docSnap.id, likesArray);
                }
            }
        });
    });
}

// ------------------ Eventos ------------------
sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim();
    if(text !== '') { await sendMessage(text); msgInput.value = ''; }
});
msgInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendBtn.click(); });

// ------------------ Contatos ------------------
async function loadContacts() {
    const sidebar = document.querySelector('.sidebar');
    document.querySelectorAll('.contact-item').forEach(c => c.remove());
    if(!currentUser) return;

    try {
        const contactsSnapshot = await getDocs(collection(db, "users", currentUser.uid, "contacts"));
        contactsSnapshot.forEach(docSnap => {
            const contact = docSnap.data();
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
            div.style.transition = '0.2s all';
            div.onmouseover = () => div.style.background = '#1b8c87';
            div.onmouseout = () => div.style.background = '#23a6a0';

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

            const span = document.createElement('span');
            span.textContent = contact.email;
            span.style.flexGrow = '1';

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.style.background = '#ff4c4c';
            removeBtn.style.border = 'none';
            removeBtn.style.color = '#fff';
            removeBtn.style.borderRadius = '4px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '2px 6px';
            removeBtn.addEventListener('click', async e => {
                e.stopPropagation();
                if(!confirm(`Remover ${contact.email}?`)) return;
                await deleteDoc(doc(db, "users", currentUser.uid, "contacts", docSnap.id));
                loadContacts();
                if(currentChatContact && currentChatContact.uid === docSnap.id) {
                    messagesDiv.innerHTML = ''; currentChatContact = null;
                }
            });

            div.appendChild(avatar); div.appendChild(span); div.appendChild(removeBtn);
            div.addEventListener('click', () => {
                currentChatContact = { uid: docSnap.id, email: contact.email };
                messagesDiv.innerHTML = '';
                listenMessages();
            });

            sidebar.insertBefore(div, addContactBtn.nextSibling);
        });
    } catch(err) { console.error(err); }
}

// Adicionar contato
addContactBtn.addEventListener('click', () => {
    if(!currentUser) return alert("Faça login primeiro!");
    if(document.getElementById('newContactInput')) return;
    const input = document.createElement('input');
    input.id = 'newContactInput';
    input.placeholder = 'Digite email do contato';
    input.type = 'email';
    input.style.padding = '8px';
    input.style.marginBottom = '5px';
    input.style.borderRadius = '5px';
    input.style.border = '1px solid #ccc';
    input.style.fontSize = '14px';

    const sidebar = document.querySelector('.sidebar');
    sidebar.insertBefore(input, addContactBtn.nextSibling);
    input.focus();

    input.addEventListener('keypress', async e => {
        if(e.key === 'Enter') {
            const email = input.value.trim();
            if(!email) return alert("Digite um email válido.");
            try {
                const docRef = await addDoc(collection(db, "users", currentUser.uid, "contacts"), {
                    email, addedAt: serverTimestamp()
                });
                input.remove(); loadContacts();
                currentChatContact = { uid: docRef.id, email };
                messagesDiv.innerHTML = ''; listenMessages();
            } catch(err) { console.error(err); alert("Erro ao adicionar contato."); }
        }
    });
});

// ------------------ Upload de imagens ------------------
const chatArea = document.querySelector('.input-area');
const uploadBtn = document.createElement('button');
uploadBtn.textContent = '📎';
uploadBtn.style.fontSize = '18px';
uploadBtn.style.border = 'none';
uploadBtn.style.background = '#05635f';
uploadBtn.style.color = 'white';
uploadBtn.style.borderRadius = '25px';
uploadBtn.style.cursor = 'pointer';
uploadBtn.style.padding = '0 12px';
chatArea.insertBefore(uploadBtn, msgInput);

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if(file) await sendImage(file);
    fileInput.value = '';
});
