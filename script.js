import { db, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, registerUser, loginUser } from "./firebase.js";

// Elementos do DOM
const msgInput = document.getElementById("msgInput");
const messagesContainer = document.getElementById("messages");
const contactsDiv = document.getElementById("contacts");

// Coleção Firestore
const messagesRef = collection(db, "messages");

// Exibir mensagens em tempo real
const q = query(messagesRef, orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.textContent = data.text;
        messagesContainer.appendChild(messageElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Funções globais para HTML
window.sendMessage = function() {
    const msg = msgInput.value.trim();
    if (!msg) return;

    addDoc(messagesRef, {
        text: msg,
        timestamp: serverTimestamp()
    }).then(() => {
        msgInput.value = "";
    }).catch(err => {
        alert("Erro ao enviar mensagem: " + err.message);
    });
};

window.addContact = function() {
    const contactName = prompt("Digite o nome do contato:");
    if (!contactName) return;

    const contactElement = document.createElement("div");
    contactElement.classList.add("contact");
    contactElement.textContent = contactName;
    contactsDiv.appendChild(contactElement);
};

window.handleRegister = function() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if (!email || !password) {
        alert("E-mail e senha são obrigatórios!");
        return;
    }

    registerUser(email, password)
        .then(() => alert("Usuário registrado com sucesso!"))
        .catch(err => alert("Erro ao registrar: " + err.message));
};

window.handleLogin = function() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if (!email || !password) {
        alert("E-mail e senha são obrigatórios!");
        return;
    }

    loginUser(email, password)
        .then(() => alert("Login realizado com sucesso!"))
        .catch(err => alert("Erro ao logar: " + err.message));
};
