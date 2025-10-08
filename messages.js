import { db } from './firebaseConfig.js';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export async function sendMessage(contactEmail, text) {
  try {
    await addDoc(collection(db, "messages"), {
      to: contactEmail,
      text,
      timestamp: serverTimestamp()
    });
  } catch(err) { console.error(err); }
}

export function listenMessages(contactEmail) {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  onSnapshot(q, snapshot => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = '';
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if(data.to === contactEmail) {
        const div = document.createElement('div');
        div.textContent = data.text;
        div.className = 'message';
        messagesDiv.appendChild(div);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
