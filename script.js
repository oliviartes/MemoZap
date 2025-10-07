import { auth, registerUser, loginUser, sendMessage, listenMessages } from "./firebase.js";
import { 
    updateProfile, updateEmail, updatePassword, sendEmailVerification, 
    sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// -----------------------
// DOM
// -----------------------
const msgInput = document.getElementById("msgInput");
const messagesContainer = document.getElementById("messages");
const contactsDiv = document.getElementById("contacts");

// -----------------------
// Mensagens em tempo real
// -----------------------
listenMessages(msgs => {
    messagesContainer.innerHTML = "";
    const user = auth.currentUser;
    msgs.forEach(m => {
        const div = document.createElement("div");
        div.classList.add("message");
        if(user && m.uid === user.uid) div.classList.add("mine");
        div.textContent = `${m.email || "Anônimo"}: ${m.text}`;
        messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// -----------------------
// Observador de autenticação
// -----------------------
onAuthStateChanged(auth, user => {
    if(user) console.log("Usuário logado:", user.email);
    else console.log("Usuário deslogado");
});

// -----------------------
// Registro e Login
// -----------------------
window.handleRegister = async () => {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if(!email || !password) return alert("E-mail e senha obrigatórios!");
    try { await registerUser(email, password); alert("Registrado com sucesso!"); }
    catch(e){ alert("Erro: " + e.message); }
};

window.handleLogin = async () => {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if(!email || !password) return alert("E-mail e senha obrigatórios!");
    try { await loginUser(email, password); alert("Login realizado!"); }
    catch(e){ alert("Erro: " + e.message); }
};

// -----------------------
// Enviar mensagem
// -----------------------
window.sendMessage = async () => {
    const text = msgInput.value.trim();
    if(!text) return;
    try { await sendMessage(text); msgInput.value = ""; }
    catch(e){ alert("Erro: " + e.message); }
};

// -----------------------
// Contatos
// -----------------------
window.addContact = () => {
    const name = prompt("Nome do contato:");
    if(!name) return;
    const div = document.createElement("div");
    div.classList.add("contact");
    div.textContent = name;
    contactsDiv.appendChild(div);
};

// -----------------------
// Atualizar perfil
// -----------------------
window.updateUserProfile = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    const displayName = prompt("Nome de exibição:", user.displayName || "");
    const photoURL = prompt("URL da foto:", user.photoURL || "");
    try {
        await updateProfile(user, { displayName, photoURL });
        alert("Perfil atualizado!");
    } catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Atualizar e-mail
// -----------------------
window.updateUserEmail = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    const email = prompt("Novo e-mail:", user.email);
    if(!email) return;
    try { await updateEmail(user, email); alert("E-mail atualizado!"); }
    catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Atualizar senha
// -----------------------
window.updateUserPassword = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    const password = prompt("Nova senha:");
    if(!password) return;
    try { await updatePassword(user, password); alert("Senha atualizada!"); }
    catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Enviar e-mail de verificação
// -----------------------
window.sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    try { await sendEmailVerification(user); alert("E-mail de verificação enviado!"); }
    catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Redefinir senha
// -----------------------
window.sendResetPasswordEmail = async () => {
    const email = prompt("Digite seu e-mail:");
    if(!email) return;
    try { await sendPasswordResetEmail(auth, email); alert("E-mail de redefinição enviado!"); }
    catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Excluir conta
// -----------------------
window.deleteUserAccount = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    if(!confirm("Tem certeza que quer excluir sua conta?")) return;
    try { await deleteUser(user); alert("Conta excluída!"); }
    catch(e) { alert("Erro: " + e.message); }
};

// -----------------------
// Reautenticação
// -----------------------
window.reauthenticateUser = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");
    const email = prompt("Digite seu e-mail novamente:");
    const password = prompt("Digite sua senha novamente:");
    if(!email || !password) return alert("E-mail e senha obrigatórios.");
    const credential = EmailAuthProvider.credential(email, password);
    try { await reauthenticateWithCredential(user, credential); alert("Reautenticado com sucesso!"); }
    catch(e) { alert("Erro: " + e.message); }
};
