import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
    contactsList.innerHTML = "";
    snapshot.forEach((doc) => {
      const contact = doc.data();
      const div = document.createElement("div");
      div.className = "contact-item";
      div.textContent = contact.email;
      contactsList.appendChild(div);
    });
  });
});
