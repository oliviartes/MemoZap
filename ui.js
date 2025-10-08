import { auth, onAuthChange, sendVerificationEmailFn, updateUserProfile, updateUserEmailFn, updateUserPasswordFn, deleteUserAccountFn, reauthenticateUserFn, sendResetPasswordEmailFn } from "./firebaseConfig.js";
import { sendMessage, listenMessages } from "./chat.js";

// DOM
const msgInput = document.getElementById("msgInput");
const messagesContainer = document.getElementById("messages");
const contactsDiv = document.getElementById("contacts");

// -----------------------
// Chat em tempo real
// -----------------------
listenMessages(msgs => {
  messagesContainer.innerHTML = "";
  const user = auth.currentUser;
  msgs.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("message");
    if(user && m.uid === user.uid) div.classList.add("mine");
    div.innerHTML = `<b>${m.email || "Anônimo"}:</b> ${m.text} <button onclick="addStarMessage('${m.id}')">⭐ ${m.starCount || 0}</button>`;
    messagesContainer.appendChild(div);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

window.sendMessageClick = async () => {
  const text = msgInput.value.trim();
  if(!text) return;
  try { await sendMessage(text); msgInput.value = ""; }
  catch(e){ console.error(e); alert("Erro ao enviar mensagem"); }
};

window.addStarMessage = async (id) => {
  try { await import("./chat.js").then(mod => mod.addStar(id)); }
  catch(e){ console.error(e); }
};

// -----------------------
// Contatos simples (salvos no front-end por enquanto)
window.addContact = () => {
  const name = prompt("Nome do contato:");
  if(!name) return;
  const div = document.createElement("div");
  div.classList.add("contact");
  div.textContent = name;
  contactsDiv.appendChild(div);
};

// -----------------------
// Observador de autenticação
// -----------------------
onAuthChange(user => {
  if(user) console.log("Usuário logado:", user.email);
  else console.log("Usuário deslogado");
});

// -----------------------
// Perfil, senha e email
// -----------------------
window.updateUserProfileClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  const displayName = prompt("Nome de exibição:", user.displayName || "");
  const photoURL = prompt("URL da foto:", user.photoURL || "");
  try { await updateUserProfile(user, displayName, photoURL); alert("Perfil atualizado!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.updateUserEmailClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  const email = prompt("Novo e-mail:", user.email);
  if(!email) return;
  try { await updateUserEmailFn(user, email); alert("E-mail atualizado!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.updateUserPasswordClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  const password = prompt("Nova senha:");
  if(!password) return;
  try { await updateUserPasswordFn(user, password); alert("Senha atualizada!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.sendVerificationEmailClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  try { await sendVerificationEmailFn(user); alert("E-mail de verificação enviado!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.sendResetPasswordEmailClick = async () => {
  const email = prompt("Digite seu e-mail:");
  if(!email) return;
  try { await sendResetPasswordEmailFn(email); alert("E-mail de redefinição enviado!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.deleteUserAccountClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  if(!confirm("Tem certeza que quer excluir sua conta?")) return;
  try { await deleteUserAccountFn(user); alert("Conta excluída!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};

window.reauthenticateUserClick = async () => {
  const user = auth.currentUser;
  if(!user) return alert("Você precisa estar logado.");
  const email = prompt("Digite seu e-mail novamente:");
  const password = prompt("Digite sua senha novamente:");
  if(!email || !password) return alert("E-mail e senha obrigatórios.");
  try { await reauthenticateUserFn(user, email, password); alert("Reautenticado com sucesso!"); }
  catch(e){ console.error(e); alert("Erro: " + e.message); }
};
