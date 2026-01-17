import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const contactsList = document.getElementById("contactsList");
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const contactsRef = collection(db, "users", user.uid, "contacts");

  onSnapshot(contactsRef, (snapshot) => {
    contactsList.innerHTML = ""; // limpa lista

    snapshot.forEach((docSnap) => {
      const contact = docSnap.data();
      const div = document.createElement("div");
      div.className = "contact-item";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.padding = "8px";
      div.style.borderBottom = "1px solid #eee";

      // 🔹 mostrar apenas o primeiro nome
      const span = document.createElement("span");
      let displayName = "Contato";
      if (contact.name) {
        displayName = contact.name.split(" ")[0];
      } else if (contact.email) {
        displayName = contact.email.split("@")[0];
      }
      span.textContent = displayName;

      // botão excluir
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Excluir";
      deleteBtn.style.background = "#ff4d4d";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "5px";
      deleteBtn.style.padding = "4px 8px";
      deleteBtn.style.cursor = "pointer";

      deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm(`Deseja excluir ${displayName}?`);
        if (!confirmDelete) return;
        try {
          await deleteDoc(doc(db, "users", user.uid, "contacts", docSnap.id));
          alert(`${displayName} excluído com sucesso!`);
        } catch (err) {
          console.error(err);
          alert("Erro ao excluir contato");
        }
      });

      div.appendChild(span);
      div.appendChild(deleteBtn);
      contactsList.appendChild(div);
    });
  });
});
