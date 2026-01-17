<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
  <title>MemoZap — Autenticação</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: #fff;
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 0;
      color: #000;
    }
    .auth-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #05635f;
      margin-bottom: 30px;
    }
    .auth-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .auth-section h2 {
      margin-top: 0;
      color: #05635f;
      font-size: 1.1rem;
      margin-bottom: 15px;
    }
    .auth-section input {
      width: 100%;
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
      outline: none;
      font-size: 0.95rem;
    }
    .auth-section button {
      width: 100%;
      padding: 10px;
      background: #05635f;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      margin-bottom: 5px;
      transition: background 0.2s, transform 0.2s;
    }
    .auth-section button:hover {
      background: #04897e;
      transform: scale(1.02);
    }
    .back-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #05635f;
      color: white;
      border: none;
      border-radius: 50%;
      width: 55px;
      height: 55px;
      font-size: 24px;
      text-align: center;
      line-height: 55px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transition: background 0.2s, transform 0.2s;
      z-index: 1000;
    }
    .back-btn:hover {
      background-color: #04897e;
      transform: scale(1.05);
    }
    /* FOTO DE PERFIL */
    #profilePreview {
      display: block;
      margin: 10px auto;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      background: #eee;
    }
    #uploadProgress {
      width: 0%;
      height: 8px;
      background: #05635f;
      border-radius: 4px;
      margin-top: 10px;
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="auth-container">
    <h1>MemoZap 💬</h1>

    <!-- LOGIN -->
    <section class="auth-section">
      <h2>Login</h2>
      <input type="email" id="loginEmail" placeholder="Email">
      <input type="password" id="loginPassword" placeholder="Senha">
      <button id="loginBtn">Entrar</button>
    </section>

    <!-- REGISTRO -->
    <section class="auth-section">
      <h2>Registrar</h2>
      <input type="text" id="registerFirstName" placeholder="Nome">
      <input type="text" id="registerLastName" placeholder="Sobrenome">
      <input type="email" id="registerEmail" placeholder="Email">
      <input type="password" id="registerPassword" placeholder="Senha">
      <button id="registerBtn">Registrar</button>
    </section>

    <!-- PERFIL / SEGURANÇA -->
    <section class="auth-section">
      <h2>Perfil / Segurança</h2>
      <img id="profilePreview" src="img/default-avatar.png" alt="Prévia da foto">
      <input type="file" id="profileFile" accept="image/*">
      <div id="uploadProgress"></div>
      <button id="uploadPhotoBtn">Salvar Foto</button>

      <button id="updateProfileBtn">Atualizar Nome</button>
      <button id="updateEmailBtn">Atualizar E-mail</button>
      <button id="updatePasswordBtn">Atualizar Senha</button>
      <button id="sendVerificationBtn">Enviar Verificação</button>
      <button id="resetPasswordBtn">Redefinir Senha</button>
      <button id="logoutBtn">Sair</button>
    </section>
  </div>

  <button class="back-btn" id="backBtn">⬅</button>

  <!-- IMPORTAÇÃO DO FIREBASE -->
  <script type="module">
    import { auth, db } from './firebaseConfig.js';
    import { 
      createUserWithEmailAndPassword, 
      signInWithEmailAndPassword, 
      updateProfile, 
      updateEmail, 
      updatePassword, 
      sendEmailVerification, 
      sendPasswordResetEmail, 
      signOut,
      onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
    import { 
      getStorage, ref, uploadBytesResumable, getDownloadURL 
    } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
    import { setDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

    // ELEMENTOS
    const preview = document.getElementById('profilePreview');
    const fileInput = document.getElementById('profileFile');
    const progressBar = document.getElementById('uploadProgress');
    let selectedFile = null;

    // PREVIEW IMAGEM
    fileInput.addEventListener('change', e => {
      selectedFile = e.target.files[0];
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = () => preview.src = reader.result;
        reader.readAsDataURL(selectedFile);
      }
    });

    // LOGIN
    document.getElementById('loginBtn').addEventListener('click', () => {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      if(!email || !password) return alert("Preencha email e senha!");

      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          alert(`Bem-vindo(a) ${userCredential.user.displayName || userCredential.user.email}`);
          window.location.href = 'index.html';
        })
        .catch(error => alert(error.message));
    });

    // REGISTRO + SALVAR NO FIRESTORE
    document.getElementById('registerBtn').addEventListener('click', async () => {
      const firstName = document.getElementById('registerFirstName').value;
      const lastName = document.getElementById('registerLastName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;

      if(!firstName || !lastName || !email || !password) return alert("Preencha todos os campos!");

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Atualiza o displayName e define foto padrão
        await updateProfile(user, { 
          displayName: `${firstName} ${lastName}`,
          photoURL: "img/default-avatar.png"
        });

        // Cria documento no Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          firstName,
          lastName,
          email,
          profilePic: "img/default-avatar.png",
          createdAt: new Date()
        });

        alert("✅ Conta criada com sucesso!");
        window.location.href = 'contacts.html';
      } catch (error) {
        alert(error.message);
      }
    });

    // UPLOAD DE FOTO DE PERFIL
    document.getElementById('uploadPhotoBtn').addEventListener('click', async () => {
      const user = auth.currentUser;
      if(!user) return alert("Faça login primeiro!");
      if(!selectedFile) return alert("Escolha uma imagem!");

      const storage = getStorage();
      const filePath = `profilePics/${user.uid}/${Date.now()}-${selectedFile.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressBar.style.width = progress + '%';
        },
        (error) => alert("Erro no upload: " + error.message),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateProfile(user, { photoURL: downloadURL });
          await updateDoc(doc(db, "users", user.uid), { profilePic: downloadURL });
          preview.src = downloadURL;
          alert("✅ Foto atualizada com sucesso!");
        }
      );
    });

    // PERFIL / SEGURANÇA
    document.getElementById('updateProfileBtn').addEventListener('click', async () => {
      const displayName = prompt("Digite seu novo nome:");
      if(!displayName) return;
      const user = auth.currentUser;
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { 
        firstName: displayName.split(" ")[0] || displayName, 
        lastName: displayName.split(" ")[1] || "" 
      });
      alert("Nome atualizado!");
    });

    document.getElementById('updateEmailBtn').addEventListener('click', async () => {
      const newEmail = prompt("Novo email:");
      if(!newEmail) return;
      await updateEmail(auth.currentUser, newEmail);
      await updateDoc(doc(db, "users", auth.currentUser.uid), { email: newEmail });
      alert("Email atualizado!");
    });

    document.getElementById('updatePasswordBtn').addEventListener('click', async () => {
      const newPassword = prompt("Nova senha:");
      if(!newPassword) return;
      await updatePassword(auth.currentUser, newPassword);
      alert("Senha atualizada!");
    });

    document.getElementById('sendVerificationBtn').addEventListener('click', () => {
      sendEmailVerification(auth.currentUser)
        .then(() => alert("Email de verificação enviado!"))
        .catch(err => alert(err.message));
    });

    document.getElementById('resetPasswordBtn').addEventListener('click', () => {
      const email = prompt("Digite seu email:");
      if(!email) return;
      sendPasswordResetEmail(auth, email)
        .then(() => alert("Email de redefinição enviado!"))
        .catch(err => alert(err.message));
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      signOut(auth).then(() => {
        alert("Desconectado!");
        window.location.href = 'auth.html';
      });
    });

    // Atualiza a prévia da foto se o usuário já tiver uma
    onAuthStateChanged(auth, (user) => {
      if(user?.photoURL) preview.src = user.photoURL;
    });

    // BOTÃO VOLTAR
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'index.html');
  </script>
</body>
</html>
