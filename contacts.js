import { db } from './firebaseConfig.js';
import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export function listenContacts(container, callback) {
  const userContacts = collection(db, "users/contacts"); // ajuste conforme seu Firestore
  onSnapshot(userContacts, snapshot => {
    container.innerHTML = '';
    snapshot.forEach(docSnap => {
      const contact = docSnap.data();
      const div = document.createElement('div');
      div.className = 'contact-item';
      div.textContent = contact.email;
      div.addEventListener('click', () => callback(contact));
      container.appendChild(div);
    });
  });
}

export async function addContact(email) {
  if(!email) return;
  try {
    await addDoc(collection(db, "users/contacts"), { email });
  } catch(err) { console.error(err); }
}
