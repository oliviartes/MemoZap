// messages.js
import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { formatTimestamp } from "./utils.js";

// 🔹 Enviar mensagem
export async function sendMessage(contactEmail, text) {
  if (!auth.currentUser) return alert("Faça login primeiro!");
  if (!contactEmail) return alert("Selecione um contato!");

  try {
    await addDoc(collection(db, "messages"), {
      from: auth.currentUser.email,
      to: contactEmail,
      text,
      timestamp: serverTimestamp(),
      liked: false,
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

// 🔹 Escutar mensagens em tempo real
export function listenMessages(contactEmail, container) {
  if (!auth.currentUser || !contactEmail) return;

  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      if (
        (msg.from === auth.currentUser.email && msg.to === contactEmail) ||
        (msg.from === contactEmail && msg.to === auth.currentUser.email)
      ) {
        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(
          msg.from === auth.currentUser.email ? "sent" : "received"
        );

        div.innerHTML = `
          <p>${msg.text}</p>
          <small>${formatTimestamp(msg.timestamp)}</small>
          <button class="like-btn">${msg.liked ? "❤️" : "🤍"}</button>
        `;

        // Curtir mensagem
        const likeBtn = div.querySelector(".like-btn");
        likeBtn.addEventListener("click", async () => {
          await updateMessageLike(doc.id, !msg.liked);
        });

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      }
    });
  });
}

// 🔹 Atualizar curtida
async function updateMessageLike(id, liked) {
  const docRef = collection(db, "messages").doc(id);
  await docRef.update({ liked });
}
