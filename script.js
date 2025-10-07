// Importa as funções do firebase.js
import { registerUser, loginUser } from "./firebase.js";

// Elementos do DOM
const msgInput = document.getElementById("msgInput");
const messagesContainer = document.getElementById("messages");

// -----------------------
// Simples chat (local)
// -----------------------
export function sendMessage() {
    const msg = msgInput.value.trim();
    if (msg === "") return;

    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.textContent = msg;
    messagesContainer.appendChild(messageElement);

    msgInput.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// -----------------------
// Contatos
// -----------------------
export function addContact() {
    const contactName = prompt("Digite o nome do contato:");
    if (!contactName) return;

    const contactsDiv = document.getElementById("contacts");
    const contactElement = document.createElement("div");
    contactElement.classList.add("contact");
    contactElement.textContent = contactName;
    contactsDiv.appendChild(contactElement);
}

// -----------------------
// Autenticação Firebase
// -----------------------
export function handleRegister() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");

    if (!email || !password) {
        alert("E-mail e senha são obrigatórios!");
        return;
    }

    registerUser(email, password)
        .then(() => alert("Usuário registrado com sucesso!"))
        .catch(err => alert("Erro ao registrar: " + err.message));
}

export function handleLogin() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");

    if (!email || !password) {
        alert("E-mail e senha são obrigatórios!");
        return;
    }

    loginUser(email, password)
        .then(() => alert("Login realizado com sucesso!"))
        .catch(err => alert("Erro ao logar: " + err.message));
}
