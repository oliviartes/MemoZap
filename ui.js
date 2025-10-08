// ui.js
// Funções utilitárias para renderização do app (mensagens, contatos, avisos)

export function q(selector, root = document) {
  return root.querySelector(selector);
}

export function qAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// Toast simples
export function showToast(text, timeout = 3000) {
  let t = document.createElement('div');
  t.className = 'mz-toast';
  t.textContent = text;
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '8px',
    zIndex: 9999,
    fontSize: '14px'
  });
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = '0.0', timeout - 300);
  setTimeout(() => t.remove(), timeout);
}

// Formata timestamp (Firestore serverTimestamp -> Date)
export function formatTime(ts) {
  if(!ts) return '';
  // ts pode ser Date ou Timestamp (com toDate)
  let date;
  if (ts.toDate) date = ts.toDate();
  else if (ts instanceof Date) date = ts;
  else date = new Date(ts);
  const h = date.getHours().toString().padStart(2,'0');
  const m = date.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}

// Cria bolha de mensagem (compatível com mensagens de texto e imagem)
// options: { id, text, imageUrl, from: 'me'|'other', timestamp, likes }
export function createMessageBubble({ id=null, text='', imageUrl=null, from='other', timestamp=null, likes=0 }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg ' + (from === 'me' ? 'me' : 'other');
  if (id) wrapper.dataset.msgId = id;

  // Conteúdo
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'imagem';
    img.loading = 'lazy';
    wrapper.appendChild(img);
    if (text) {
      const caption = document.createElement('div');
      caption.textContent = text;
      caption.style.marginTop = '8px';
      wrapper.appendChild(caption);
    }
  } else {
    wrapper.textContent = text;
  }

  // Meta (hora)
  if (timestamp) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatTime(timestamp);
    wrapper.appendChild(meta);
  }

  // Likes / Reactions badge básico
  const likesBadge = document.createElement('div');
  likesBadge.className = 'likes-badge';
  likesBadge.textContent = likes > 0 ? `👍 ${likes}` : '';
  Object.assign(likesBadge.style, {
    position: 'absolute',
    bottom: '-10px',
    right: '8px',
    fontSize: '12px',
    background: 'transparent',
    color: from === 'me' ? 'white' : '#333'
  });
  wrapper.appendChild(likesBadge);

  // hover para mostrar reações (o seu messages.js pode ligar event handlers aqui)
  wrapper.addEventListener('mouseenter', () => wrapper.classList.add('hover'));
  wrapper.addEventListener('mouseleave', () => wrapper.classList.remove('hover'));

  return wrapper;
}

// Renderiza lista de mensagens (limpa e injeta)
export function renderMessages(containerEl, messagesArray) {
  // messagesArray: [{id, text, imageUrl, from, timestamp, likes}]
  containerEl.innerHTML = '';
  messagesArray.forEach(m => {
    const bubble = createMessageBubble(m);
    containerEl.appendChild(bubble);
  });
  containerEl.scrollTo({ top: containerEl.scrollHeight, behavior: 'smooth' });
}

// Cria item de contato para a sidebar
// contact: { id, name, email, avatarUrl }
export function createContactItem(contact) {
  const div = document.createElement('div');
  div.className = 'contact-item';
  div.dataset.contactId = contact.id || '';
  div.title = contact.email || '';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = contact.name ? contact.name.charAt(0).toUpperCase() : (contact.email ? contact.email.charAt(0).toUpperCase() : '?');
  div.appendChild(avatar);

  const meta = document.createElement('div');
  meta.className = 'contact-meta';
  const nameEl = document.createElement('div');
  nameEl.className = 'name';
  nameEl.textContent = contact.name || contact.email || 'Contato';
  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = contact.lastMessage || '';
  meta.appendChild(nameEl);
  meta.appendChild(sub);

  div.appendChild(meta);

  // small remove button (optional)
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-contact';
  removeBtn.textContent = '✖';
  Object.assign(removeBtn.style, { background:'transparent', border:'none', color:'inherit', cursor:'pointer' });
  div.appendChild(removeBtn);

  return div;
}

// Renderiza lista de contatos no container
export function renderContacts(containerEl, contactsArray) {
  containerEl.innerHTML = '';
  contactsArray.forEach(c => {
    const item = createContactItem(c);
    containerEl.appendChild(item);
  });
}

// Helper para mostrar/ocultar loading em botões
export function setBtnLoading(btnEl, isLoading=true, text='') {
  if(!btnEl) return;
  btnEl.disabled = isLoading;
  if (isLoading) {
    btnEl.dataset._origText = btnEl.textContent;
    btnEl.textContent = text || '...';
  } else {
    if (btnEl.dataset._origText) btnEl.textContent = btnEl.dataset._origText;
  }
}
