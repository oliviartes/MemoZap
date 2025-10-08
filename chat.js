// chat.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, sendPasswordResetEmail } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuração do Firebase (substitua pelos seus dados)
import { firebaseConfig } from "./firebaseConfig.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------------------
// Função para enviar mensagem
// ------------------------------
export async function sendMessage() {
    const msgInput = document.getElementById("msgInput");
    const texto = msgInput.value.trim();
    if (texto === "") return;

    try {
        await addDoc(collection(db, "mensagens"), {
            texto,
            timestamp: serverTimestamp()
        });
        msgInput.value = "";
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
}

// ------------------------------
// Função para resetar senha
// ------------------------------
export function sendResetPasswordEmailFunc() {
    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim();
    if (!email) return alert("Digite seu email");

    sendPasswordResetEmail(auth, email)
        .then(() => alert("Email de redefinição enviado!"))
        .catch(err => console.error("Erro ao enviar email:", err));
}

// ------------------------------
// Receber mensagens em tempo real
// ------------------------------
const messagesContainer = document.getElementById("messages");

const q = query(collection(db, "mensagens"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = ""; // limpa mensagens antigas
    snapshot.forEach(doc => {
        const msg = doc.data();
        const div = document.createElement("div");
        div.textContent = msg.texto;
        messagesContainer.appendChild(div);
    });
});

// ------------------------------
// Eventos dos botões
// ------------------------------
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("resetBtn").addEventListener("click", sendResetPasswordEmailFunc);
