// reply.js
import { db } from './firebaseConfig.js';
import { currentUser } from './user.js';
import { doc, updateDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let replyingMessage = null;
let lastMessageDate = null; // 🔹 controla quando mostrar o separador de data

// ===== REPLY PREVIEW UI =====
const replyPreviewDiv = document.createElement('div');
replyPreviewDiv.className = 'reply-preview';
replyPreviewDiv.style.display = 'none';
replyPreviewDiv.style.flexDirection = 'row';
replyPreviewDiv.style.alignItems = 'center';
replyPreviewDiv.style.padding = '6px 12px';
replyPreviewDiv.style.background = '#f1f1f1';
replyPreviewDiv.style.borderRadius = '12px';
replyPreviewDiv.style.marginBottom = '6px';
replyPreviewDiv.style.fontSize = '0.85rem';

const replyTextSpan = document.createElement('span');
replyTextSpan.style.flex = '1';

const cancelReplySpan = document.createElement('span');
cancelReplySpan.textContent = '❌';
cancelReplySpan.style.cursor = 'pointer';
cancelReplySpan.style.marginLeft = '10px';

replyPreviewDiv.appendChild(replyTextSpan);
replyPreviewDiv.appendChild(cancelReplySpan);

function attachReplyUI(msgInput){
    msgInput.parentNode.insertBefore(replyPreviewDiv, msgInput);
    cancelReplySpan.addEventListener('click', () => {
        replyingMessage = null;
        replyPreviewDiv.style.display = 'none';
        replyTextSpan.textContent = '';
    });
    return { replyPreviewDiv, replyTextSpan, cancelReplySpan };
}

// ===== REPLY GESTURE =====
function enableReplyGesture(msgDiv, msgData){
    let startX=0, currentX=0, dragging=false;
    const threshold=40;

    const handleStart = e => {
        dragging = true;
        startX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        msgDiv.style.transition = 'none';
    };
    const handleMove = e => {
        if(!dragging) return;
        currentX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        msgDiv.classList.toggle('swipe-reply', currentX-startX > threshold);
    };
    const handleEnd = e => {
        if(msgDiv.classList.contains('swipe-reply')){
            replyingMessage = msgData;
            replyTextSpan.textContent = msgData.text || (msgData.fileName ? `[Imagem: ${msgData.fileName}]` : '');
            replyPreviewDiv.style.display = 'flex';
        }
        dragging = false;
        msgDiv.classList.remove('swipe-reply');
    };

    ['mousedown','touchstart'].forEach(ev=>msgDiv.addEventListener(ev, handleStart));
    ['mousemove','touchmove'].forEach(ev=>msgDiv.addEventListener(ev, handleMove));
    ['mouseup','mouseleave','touchend'].forEach(ev=>msgDiv.addEventListener(ev, handleEnd));

    msgDiv.addEventListener('dblclick', ()=> {
        replyingMessage = msgData;
        replyTextSpan.textContent = msgData.text || (msgData.fileName ? `[Imagem: ${msgData.fileName}]` : '');
        replyPreviewDiv.style.display = 'flex';
    });
}

// ===== ADD MESSAGE =====
function addMessage(msg, id, messagesDiv, localTime=false){
    const fromUser = msg.uid === currentUser?.uid;

    // 🔹 Calcula data da mensagem
    let date = localTime && msg._localTimestamp ? msg._localTimestamp :
               msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();

    const msgDateStr = date.toLocaleDateString('pt-BR');
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');
    let dateLabel = msgDateStr;
    if(msgDateStr === todayStr) dateLabel = "Hoje";
    else if(msgDateStr === yesterday) dateLabel = "Ontem";

    // 🔹 Adiciona separador de data se mudou o dia
    if(lastMessageDate === null || lastMessageDate !== msgDateStr){
        lastMessageDate = msgDateStr;
        const dateDiv = document.createElement('div');
        dateDiv.textContent = dateLabel;
        dateDiv.style.textAlign = 'center';
        dateDiv.style.margin = '15px auto';
        dateDiv.style.padding = '6px 12px';
        dateDiv.style.background = '#d9fdd3';
        dateDiv.style.color = '#444';
        dateDiv.style.fontSize = '12px';
        dateDiv.style.borderRadius = '12px';
        dateDiv.style.width = 'fit-content';
        dateDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        messagesDiv.appendChild(dateDiv);
    }

    // 🔹 Cria o container da mensagem
    const msgDiv = document.createElement('div');
    msgDiv.className = fromUser ? 'message sent' : 'message received';
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.gap = '6px';
    msgDiv.style.margin = '6px';
    msgDiv.style.maxWidth = '70%';
    msgDiv.style.padding = '10px';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.background = fromUser ? '#05635f' : '#eee';
    msgDiv.style.color = fromUser ? '#fff' : '#000';
    msgDiv.dataset.id = id || '';

    if(msg.replyTo){
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply-bubble';
        replyDiv.textContent = msg.replyTo.text.length>50 ? msg.replyTo.text.slice(0,50)+'…' : msg.replyTo.text;
        msgDiv.appendChild(replyDiv);
    }

    if(msg.fileName){
        const img = document.createElement('img');
        img.src = msg.fileUrl||'';
        img.alt = msg.fileName||'Imagem';
        img.style.maxWidth='220px';
        img.style.borderRadius='8px';
        img.style.objectFit='cover';
        msgDiv.appendChild(img);
    }

    if(msg.text){
        const p = document.createElement('p');
        p.textContent = msg.text;
        p.style.margin = 0;
        msgDiv.appendChild(p);
    }

    const timeSpan = document.createElement('span');
    timeSpan.style.fontSize='10px';
    timeSpan.style.alignSelf='flex-end';
    timeSpan.style.color = fromUser ? '#ccc':'#555';
    const hours = date.getHours().toString().padStart(2,'0');
    const minutes = date.getMinutes().toString().padStart(2,'0');
    timeSpan.textContent = `${hours}:${minutes}`;
    msgDiv.appendChild(timeSpan);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display='flex';
    actionsDiv.style.alignItems='center';
    actionsDiv.style.gap='6px';
    actionsDiv.style.marginTop='6px';

    // ===== LIKE BUTTON =====
    const likeBtn = document.createElement('button');
    likeBtn.textContent = `❤️ ${msg.likes||0}`;
    likeBtn.style.cursor='pointer';
    likeBtn.style.border='none';
    likeBtn.style.background='transparent';
    likeBtn.style.color = fromUser ? '#fff':'#000';
    likeBtn.addEventListener('click', async ()=>{
        if(!id) return;
        const msgRef = doc(db,"messages",id);
        await updateDoc(msgRef,{likes:(msg.likes||0)+1});
    });
    actionsDiv.appendChild(likeBtn);

    // ===== DELETE / SEEN STATUS =====
    if(fromUser){
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.style.cursor='pointer';
        delBtn.style.border='none';
        delBtn.style.background='transparent';
        delBtn.style.color='#fff';
        delBtn.addEventListener('click', async ()=>{
            if(!id) return;
            const msgRef = doc(db,"messages",id);
            await deleteDoc(msgRef);
        });
        actionsDiv.appendChild(delBtn);

        const seenSpan = document.createElement('span');
        seenSpan.style.marginLeft='6px';
        seenSpan.textContent = msg.seen ? '✔✔' : '✔';
        seenSpan.style.color = msg.seen ? 'green' : '#fff';
        actionsDiv.appendChild(seenSpan);

        if(id){
            const msgRef = doc(db,"messages",id);
            onSnapshot(msgRef, docSnap=>{
                if(docSnap.exists()){
                    const data = docSnap.data();
                    seenSpan.textContent = data.seen ? '✔✔' : '✔';
                    seenSpan.style.color = data.seen ? 'green' : '#fff';
                }
            });
        }
    } else {
        if(!msg.seen && id){
            const msgRef = doc(db,"messages",id);
            updateDoc(msgRef,{seen:true}).catch(console.error);
            msg.seen = true;
        }
    }

    msgDiv.appendChild(actionsDiv);
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    enableReplyGesture(msgDiv,msg);
}

// ===== RESET DATE TRACKER =====
function resetLastMessageDate(){
    lastMessageDate = null;
}

// ===== EXPORTAÇÕES =====
export { 
    attachReplyUI, 
    replyingMessage, 
    replyTextSpan, 
    replyPreviewDiv, 
    enableReplyGesture, 
    addMessage,
    resetLastMessageDate // ✅ nova função
};
