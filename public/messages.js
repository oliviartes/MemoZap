// messages.js
import { db, storage } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';
import { currentUser } from './user.js';

let unsubscribeMessages = null;
let activeContactUid = null;

function loadChatMessages(contactUid, messagesDiv) {
  if (!currentUser || !contactUid) return;

  if (activeContactUid === contactUid) return;
  activeContactUid = contactUid;

  if (unsubscribeMessages) unsubscribeMessages();

  const msgsRef = collection(db, 'messages');
  const q = query(msgsRef, orderBy('timestamp', 'asc'));

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const docItem = change.doc;
      const msg = docItem.data();
      const msgId = docItem.id;

      // Ignora mensagens apagadas
      if (msg.deleted) return;

      // Mostra apenas mensagens entre o usuário atual e o contato ativo
      if (
        Array.isArray(msg.participants) &&
        msg.participants.includes(currentUser.uid) &&
        msg.participants.includes(contactUid)
      ) {
        if (change.type === 'added') {
          addMessageWithStyle(msg, msgId, messagesDiv);
        }

        if (change.type === 'modified') {
          const msgEl = document.getElementById(msgId);
          if (msg.deleted) {
            if (msgEl) msgEl.remove();
          } else if (msgEl) {
            updateSeenIcon(msgEl, msg);
          }
        }

        // Marca mensagem do contato como lida
        if (!msg.seen && msg.uid === contactUid) {
          await updateDoc(doc(db, 'messages', msgId), { seen: true });
        }
      }
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  return unsubscribeMessages;
}

async function sendMessage(text, selectedContact, messagesDiv, replyingMessage, file) {
  if (!currentUser || !selectedContact) return alert('Selecione um contato!');
  const contactUid = selectedContact.userUid || selectedContact.uid;
  if (!contactUid) return alert('Contato inválido.');

  let fileUrl = null, fileName = null, fileType = null;

  // Upload de arquivo
  if (file) {
    const storageRef = ref(storage, `uploads/${currentUser.uid}_${Date.now()}_${file.name}`);
    const snap = await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(snap.ref);
    fileName = file.name;
    fileType = file.type;
  }

  const newMsg = {
    text: text || '',
    uid: currentUser.uid,
    email: currentUser.email || '',
    participants: [currentUser.uid, contactUid],
    seen: false,
    timestamp: serverTimestamp(),
    fileUrl,
    fileName,
    fileType,
    replyTo: replyingMessage
      ? {
          text: replyingMessage.text || '',
          uid: replyingMessage.uid || '',
          fileName: replyingMessage.fileName || null,
        }
      : null,
    deleted: false,
  };

  // Mostra a mensagem localmente antes de enviar
  addMessageWithStyle({ ...newMsg, _localTimestamp: new Date() }, `local_${Date.now()}`, messagesDiv, true);

  try {
    await addDoc(collection(db, 'messages'), newMsg);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    alert('Erro ao enviar mensagem.');
  }
}

/** Cria balão de mensagem com estilo **/
function addMessageWithStyle(msg, id, container, isLocal = false) {
  if (id && document.getElementById(id)) return;

  const wrapper = document.createElement('div');
  if (id) wrapper.id = id;

  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = msg.uid === currentUser.uid ? 'flex-end' : 'flex-start';
  wrapper.style.width = '100%';
  wrapper.style.margin = '6px 0';
  wrapper.style.padding = '0 10px';

  const bubble = document.createElement('div');
  bubble.style.background = msg.uid === currentUser.uid ? '#dcf8c6' : '#ffffff';
  bubble.style.color = '#000';
  bubble.style.padding = '10px 14px';
  bubble.style.borderRadius = '16px';
  bubble.style.maxWidth = '70%';
  bubble.style.wordWrap = 'break-word';
  bubble.style.position = 'relative';
  bubble.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
  bubble.style.textAlign = 'left';
  bubble.style.fontFamily = 'Arial, sans-serif';

  let content = msg.text ? `<div>${msg.text}</div>` : '';

  if (msg.fileUrl) {
    if (msg.fileType && msg.fileType.startsWith('image/')) {
      content += `<img src="${msg.fileUrl}" alt="${msg.fileName}" style="max-width:200px;border-radius:10px;margin-top:6px;">`;
    } else {
      content += `<a href="${msg.fileUrl}" target="_blank" style="display:block;color:#05635f;margin-top:6px;">📎 ${msg.fileName}</a>`;
    }
  }

  const time = msg._localTimestamp || (msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date());
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');

  let statusIcon = '';
  if (msg.uid === currentUser.uid) {
    statusIcon = `<span class="msg-status" style="font-size:0.8rem; margin-left:4px;">${msg.seen ? '✔✔' : '✔'}</span>`;
  }

  content += `<div class="msg-time" style="font-size:0.75rem;color:#666;margin-top:4px;text-align:right;">${hh}:${mm}${statusIcon}</div>`;
  bubble.innerHTML = content;

  // Botão de exclusão
  if (msg.uid === currentUser.uid) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '4px';
    deleteBtn.style.right = '6px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.title = 'Excluir mensagem';

    deleteBtn.onclick = async () => {
      try {
        wrapper.remove();
        if (id && !id.startsWith('local_')) {
          await updateDoc(doc(db, 'messages', id), { deleted: true });
        }
      } catch (err) {
        console.error('Erro ao excluir mensagem:', err);
      }
    };

    bubble.appendChild(deleteBtn);
  }

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

/** Atualiza dinamicamente os risquinhos **/
function updateSeenIcon(wrapper, msg) {
  const iconEl = wrapper.querySelector('.msg-status');
  if (!iconEl) return;
  iconEl.textContent = msg.seen ? '✔✔' : '✔';
}

export { loadChatMessages, sendMessage };
