// upload.js
import { auth, db, storage } from "./firebaseConfig.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/**
 * Faz upload de um arquivo (imagem) e envia a URL como mensagem.
 * Obtém automaticamente o contato ativo da interface.
 * @param {File} file - Arquivo selecionado
 */
export async function uploadFile(file) {
  try {
    if (!auth.currentUser) {
      alert("Você precisa estar logado para enviar arquivos.");
      return;
    }

    // 🔹 Obtém o e-mail do contato ativo (usado na tela)
    const contactEmail = document
      .querySelector(".contact.active")?.dataset?.email;

    if (!contactEmail) {
      alert("Nenhum contato selecionado.");
      return;
    }

    const userEmail = auth.currentUser.email;
    const timestamp = Date.now();
    const filePath = `uploads/${userEmail}/${timestamp}_${file.name}`;

    // 🔹 Cria referência no Storage
    const storageRef = ref(storage, filePath);

    // 🔹 Faz upload do arquivo
    await uploadBytes(storageRef, file);
    console.log("✅ Upload concluído:", file.name);

    // 🔹 Obtém URL pública
    const fileURL = await getDownloadURL(storageRef);

    // 🔹 Envia mensagem com a imagem para o Firestore
    await addDoc(collection(db, "messages"), {
      from: userEmail,
      to: contactEmail,
      fileURL: fileURL,
      fileName: file.name,
      type: "image",
      timestamp: serverTimestamp(),
    });

    console.log("📤 Mensagem com imagem enviada:", fileURL);

    // 🔹 Atualiza a interface
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer) {
      const msgEl = document.createElement("div");
      msgEl.className = "message sent";
      msgEl.innerHTML = `<img src="${fileURL}" alt="imagem enviada" class="chat-image" />`;
      messagesContainer.appendChild(msgEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

  } catch (error) {
    console.error("❌ Erro ao enviar arquivo:", error);
    alert("Falha ao enviar arquivo: " + error.message);
  }
}
