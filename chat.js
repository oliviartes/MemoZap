import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// -----------------------
// Enviar mensagem
// -----------------------
export async function sendMessage(text) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário precisa estar logado");

  await addDoc(collection(db, "messages"), {
    text,
    uid: user.uid,
    email: user.email,
    timestamp: serverTimestamp()
  });
}

// -----------------------
// Ouvir mensagens em tempo real
// -----------------------
export function listenMessages(callback) {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  return onSnapshot(q, snapshot => {
    const msgs = [];
    snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
}

// -----------------------
// Adicionar estrela (like) à mensagem
// -----------------------
import { increment, update, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
export async function addStar(messageId) {
  const user = auth.currentUser;
  if(!user) throw new Error("Usuário precisa estar logado");

  const messageRef = doc(db, "messages", messageId);
  await update(messageRef, {
    [`stars.${user.uid}`]: true,
    starCount: increment(1)
  });
}
