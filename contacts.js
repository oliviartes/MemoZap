// contacts.js
// Lida com contatos do MemoZap (listar, adicionar, remover, selecionar)

import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { renderContacts, showToast } from "./ui.js";

/**
 * Lista de contatos do usuário atual (Firestore)
 * Cada contato é armazenado em /usuarios/{uid}/contatos
 */
export async function listenContacts(containerEl, onSelectContact) {
  const user = auth.currentUser;
  if (!user) return;

  const contactsRef = collection(db, "usuarios", user.uid, "contatos");
  const q = query(contactsRef);

  // Atualiza automaticamente quando houver mudança
  onSnapshot(q, (snapshot) => {
    const contacts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    renderContacts(containerEl, contacts);

    // Eventos de clique para cada contato
    containerEl.querySelectorAll(".contact-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.contactId;
        const contact = contacts.find((c) => c.id === id);
        if (contact && onSelectContact) onSelectContact(contact);
      });

      // Excluir contato
      const btn = item.querySelector(".remove-contact");
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteContact(user.uid, item.dataset.contactId);
      });
    });
  });
}

/**
 * Adiciona novo contato ao Firestore
 */
export async function addContact(email) {
  const user = auth.currentUser;
  if (!user) {
    showToast("Faça login para adicionar contatos!");
    return;
  }

  if (!email || !email.includes("@")) {
    showToast("E-mail inválido!");
    return;
  }

  try {
    const contactsRef = collection(db, "usuarios", user.uid, "contatos");

    // Verifica se o contato já existe
    const q = query(contactsRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      showToast("Contato já existe!");
      return;
    }

    await addDoc(contactsRef, {
      email,
      name: email.split("@")[0],
      createdAt: new Date(),
    });

    showToast("Contato adicionado!");
  } catch (err) {
    console.error("Erro ao adicionar contato:", err);
    showToast("Erro ao adicionar contato!");
  }
}

/**
 * Exclui contato
 */
export async function deleteContact(userId, contactId) {
  try {
    const contactRef = doc(db, "usuarios", userId, "contatos", contactId);
    await deleteDoc(contactRef);
    showToast("Contato removido!");
  } catch (err) {
    console.error("Erro ao remover contato:", err);
    showToast("Erro ao remover contato!");
  }
}
