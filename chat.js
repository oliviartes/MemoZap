// -----------------------
// Importações
// -----------------------
import { auth, db, registerUser, loginUser } from "./firebase.js";
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { 
    updateProfile, updateEmail, updatePassword, sendEmailVerification, 
    sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// -----------------------
// Elementos do DOM
// -----------------------
const msgInput = document.getElementById("msgInput");
const messagesContainer = document.getElementById("messages");
const contactsDiv = document.getElementById("contacts");

// -----------------------
// Coleção Firestore
// -----------------------
const messagesRef = collection(db, "messages");

// -----------------------
// Exibir mensagens em tempo real
// -----------------------
const q = query(messagesRef, orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.textContent = `${data.email || "Anônimo"}: ${data.text}`;
        messagesContainer.appendChild(messageElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// -----------------------
// Observador de autenticação
// -----------------------
onAuthStateChanged(auth, (user) => {
    if(user) {
        console.log("Usuário logado:", user.email);
    } else {
        console.log("Usuário deslogado");
    }
});

// -----------------------
// Funções globais ligadas ao HTML
// -----------------------
window.handleRegister = async function() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if(!email || !password) return alert("E-mail e senha são obrigatórios!");

    try {
        await registerUser(email, password);
        alert("Usuário registrado com sucesso!");
    } catch(err) {
        alert("Erro ao registrar: " + err.message);
    }
};

window.handleLogin = async function() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if(!email || !password) return alert("E-mail e senha são obrigatórios!");

    try {
        await loginUser(email, password);
        alert("Login realizado com sucesso!");
    } catch(err) {
        alert("Erro ao logar: " + err.message);
    }
};

window.sendMessage = async function() {
    const msg = msgInput.value.trim();
    if(!msg) return;

    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado para enviar mensagens.");

    try {
        await addDoc(messagesRef, {
            text: msg,
            timestamp: serverTimestamp(),
            uid: user.uid,
            email: user.email
        });
        msgInput.value = "";
    } catch(err) {
        alert("Erro ao enviar mensagem: " + err.message);
    }
};

window.addContact = function() {
    const contactName = prompt("Digite o nome do contato:");
    if(!contactName) return;

    const contactElement = document.createElement("div");
    contactElement.classList.add("contact");
    contactElement.textContent = contactName;
    contactsDiv.appendChild(contactElement);
};

// -----------------------
// Atualizar perfil
// -----------------------
window.updateUserProfile = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    const displayName = prompt("Digite seu nome de exibição:", user.displayName || "");
    const photoURL = prompt("Digite a URL da sua foto:", user.photoURL || "");

    try {
        await updateProfile(user, { displayName, photoURL });
        alert("Perfil atualizado com sucesso!");
    } catch(err) {
        alert("Erro ao atualizar perfil: " + err.message);
    }
};

window.updateUserEmail = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    const email = prompt("Digite seu novo e-mail:", user.email);
    if(!email) return;

    try {
        await updateEmail(user, email);
        alert("E-mail atualizado com sucesso!");
    } catch(err) {
        alert("Erro ao atualizar e-mail: " + err.message);
    }
};

window.updateUserPassword = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    const password = prompt("Digite sua nova senha:");
    if(!password) return;

    try {
        await updatePassword(user, password);
        alert("Senha atualizada com sucesso!");
    } catch(err) {
        alert("Erro ao atualizar senha: " + err.message);
    }
};

window.sendVerificationEmail = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    try {
        await sendEmailVerification(user);
        alert("E-mail de verificação enviado!");
    } catch(err) {
        alert("Erro ao enviar e-mail de verificação: " + err.message);
    }
};

window.sendResetPasswordEmail = async function() {
    const email = prompt("Digite seu e-mail:");
    if(!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        alert("E-mail de redefinição de senha enviado!");
    } catch(err) {
        alert("Erro ao enviar e-mail: " + err.message);
    }
};

window.deleteUserAccount = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    try {
        await deleteUser(user);
        alert("Conta excluída com sucesso!");
    } catch(err) {
        alert("Erro ao excluir conta: " + err.message);
    }
};

window.reauthenticateUser = async function() {
    const user = auth.currentUser;
    if(!user) return alert("Você precisa estar logado.");

    const email = prompt("Digite seu e-mail novamente:");
    const password = prompt("Digite sua senha novamente:");
    if(!email || !password) return alert("E-mail e senha obrigatórios.");

    const credential = EmailAuthProvider.credential(email, password);

    try {
        await reauthenticateWithCredential(user, credential);
        alert("Usuário reautenticado com sucesso!");
    } catch(err) {
        alert("Erro ao reautenticar: " + err.message);
    }
};
