import { db } from "./firebase.js";
import { collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Elementos do DOM
const contactsContainer = document.getElementById("contacts");
const messagesContainer = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");

let currentContact = null;

// Função para adicionar contato
export function addContact() {
    const name = prompt("Digite o nome do contato:");
    if (!name) return;
    
    const contactDiv = document.createElement("div");
    contactDiv.classList.add("contact");
    contactDiv.textContent = name;
    contactDiv.onclick = () => selectContact(name);
    contactsContainer.appendChild(contactDiv);
}

// Selecionar contato
function selectContact(name) {
    currentContact = name;
    messagesContainer.innerHTML = "";
    listenMessages(name);
}

// Enviar mensagem
window.sendMessage = async function() {
    const text = msgInput.value.trim();
    if (!text || !currentContact) return;

    try {
        await addDoc(collection(db, "messages"), {
            contact: currentContact,
            text: text,
            timestamp: new Date()
        });
        msgInput.value = "";
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
};

// Escutar mensagens em tempo real
function listenMessages(contactName) {
    const q = query(
        collection(db, "messages"),
        orderBy("timestamp")
    );

    onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.contact === contactName) {
                const msgDiv = document.createElement("div");
                msgDiv.classList.add("message");
                msgDiv.textContent = data.text;
                messagesContainer.appendChild(msgDiv);
            }
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}
