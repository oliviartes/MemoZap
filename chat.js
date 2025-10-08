// chat.js

import { auth, db } from './firebaseConfig.js';
import { listenContacts, addContact } from './contacts.js';
import { uploadFile } from './upload.js'; // ✅ novo import para upload

// ------------------ ELEMENTOS DA TELA ------------------
const contactsContainer = document.getElementById("contactsList");
const addContactBtn = document.getElementById("addContactBtn");
const addContactInput = document.getElementById("addContactInput");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

let selectedContactEmail = null; // ✅ variável global para saber com quem está o chat ativo

// ------------------ CONTATOS ------------------

// Escutar lista de contatos em tempo real
listenContacts(contactsContainer, (contact) => {
  console.log("Contato selecionado:", contact);
  selectedContactEmail = contact.email; // ✅ guarda o e-mail do contato selecionado
  // Aqui você pode carregar o histórico de mensagens com esse contato
});

// Adicionar novo contato
addContactBtn.addEventListener("click", () => {
  const email = addContactInput.value.trim();
  if (email) {
    addContact(email);
    addContactInput.value = "";
  }
});

// ------------------ UPLOAD DE ARQUIVOS ------------------

// Quando clicar no botão de clipe 📎
uploadBtn.addEventListener("click", () => {
  fileInput.click(); // abre o seletor de arquivo
});

// Quando o usuário escolher um arquivo
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && selectedContactEmail) {
    uploadFile(selectedContactEmail, file);
  } else {
    console.warn("Nenhum contato selecionado ou arquivo inválido.");
  }
});
