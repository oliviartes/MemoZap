// chat.js
import { setAuthUI, showLastSeen, updateLastSeen, authListener, currentUser } from './user.js';
import { loadChatMessages, sendMessage } from './messages.js';
import { attachReplyUI, replyingMessage, replyPreviewDiv, resetLastMessageDate } from './reply.js';
import { uploadFile } from './upload.js';

const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const lastSeenDiv = document.getElementById('lastSeenStatus');

const contactNameEl = document.querySelector('.active-name');
const contactAvatarEl = document.querySelector('.avatar.small img');

let selectedContact = JSON.parse(localStorage.getItem('selectedContact') || 'null');
let activeListener = null;

// Interface de resposta
attachReplyUI(msgInput);

// ========== AUTENTICAÇÃO ==========
authListener(user => {
  setAuthUI(user, sendBtn, messagesDiv, lastSeenDiv);

  if (user) {
    updateLastSeen();

    if (selectedContact) {
      mostrarContato(selectedContact);
      carregarConversa(selectedContact);
    } else {
      messagesDiv.innerHTML = `
        <div class="no-contact">
          <p>Selecione um contato para iniciar uma conversa.</p>
        </div>`;
    }

    // Atualiza último visto ao sair
    window.addEventListener("beforeunload", updateLastSeen);
  }
});

// ========== MOSTRAR PERFIL DO CONTATO ==========
function mostrarContato(contact) {
  if (contactNameEl) {
    // Mostra apenas o primeiro nome
    const firstName = contact.name ? contact.name.split(' ')[0] : "Contato";
    contactNameEl.textContent = firstName;
  }

  if (contactAvatarEl) {
    contactAvatarEl.src = contact.photoURL || './img/default-avatar.png';
    contactAvatarEl.alt = contact.name || "Contato";
  }

  // Exibe status (Online / Último visto)
  showLastSeen(contact.userUid, lastSeenDiv);
}

// ========== CARREGAR CONVERSA ==========
function carregarConversa(contactData) {
  if (activeListener) {
    activeListener();
    activeListener = null;
  }

  resetLastMessageDate();
  messagesDiv.innerHTML = '<div class="loading">Carregando conversa...</div>';

  const unsub = loadChatMessages(contactData.userUid, messagesDiv);
  activeListener = unsub;
}

// ========== ENVIO DE MENSAGENS ==========
sendBtn?.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text || !selectedContact) return;

  sendMessage(text, selectedContact, messagesDiv, replyingMessage);
  msgInput.value = '';
  replyPreviewDiv.style.display = 'none';
});

// ========== UPLOAD DE ARQUIVOS ==========
uploadBtn?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  if (!files.length || !currentUser || !selectedContact)
    return alert("Selecione um contato e faça login!");

  await uploadFile(files, currentUser, selectedContact, messagesDiv);
  fileInput.value = '';
});
