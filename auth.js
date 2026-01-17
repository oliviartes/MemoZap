<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
  <title>MemoZap — Autenticação</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css" />
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
  </style>
</head>
<body>
  <div class="auth-container">
    <h1>MemoZap 💬</h1>

    <section class="auth-section">
      <h2>Login</h2>
      <input type="email" id="loginEmail" placeholder="Email">
      <input type="password" id="loginPassword" placeholder="Senha">
      <button id="loginBtn">Entrar</button>
    </section>

    <section class="auth-section">
      <h2>Registrar</h2>
      <input type="email" id="registerEmail" placeholder="Email">
      <input type="password" id="registerPassword" placeholder="Senha">
      <button id="registerBtn">Registrar</button>
    </section>

    <section class="auth-section">
      <h2>Perfil / Segurança</h2>
      <button id="updateProfileBtn">Atualizar Perfil</button>
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
    import { auth } from './firebaseConfig.js';
    import { 
      createUserWithEmailAndPassword, 
      signInWithEmailAndPassword, 
      updateProfile, 
      updateEmail, 
      updatePassword, 
      sendEmailVerification, 
      sendPasswordResetEmail, 
      signOut 
    } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

    // LOGIN
    document.getElementById('loginBtn').addEventListener('click', () => {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      if(!email || !password) return alert("Preencha email e senha!");

      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          alert(`Bem-vindo(a) ${userCredential.user.email}`);
          window.location.href = 'index.html';
        })
        .catch(error => alert(error.message));
    });

    // REGISTRO
    document.getElementById('registerBtn').addEventListener('click', () => {
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      if(!email || !password) return alert("Preencha email e senha!");

      createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          alert(`Conta criada: ${userCredential.user.email}`);
        })
        .catch(error => alert(error.message));
    });

    // ATUALIZAR PERFIL
    document.getElementById('updateProfileBtn').addEventListener('click', () => {
      const displayName = prompt("Digite seu novo nome de usuário:");
      if(!displayName) return;
      if(auth.currentUser) {
        updateProfile(auth.currentUser, { displayName })
          .then(() => alert("Nome atualizado com sucesso!"))
          .catch(err => alert(err.message));
      } else alert("Usuário não está logado!");
    });

    // ATUALIZAR EMAIL
    document.getElementById('updateEmailBtn').addEventListener('click', () => {
      const newEmail = prompt("Digite seu novo email:");
      if(!newEmail) return;
      if(auth.currentUser) {
        updateEmail(auth.currentUser, newEmail)
          .then(() => alert("Email atualizado!"))
          .catch(err => alert(err.message));
      } else alert("Usuário não está logado!");
    });

    // ATUALIZAR SENHA
    document.getElementById('updatePasswordBtn').addEventListener('click', () => {
      const newPassword = prompt("Digite sua nova senha:");
      if(!newPassword) return;
      if(auth.currentUser) {
        updatePassword(auth.currentUser, newPassword)
          .then(() => alert("Senha atualizada!"))
          .catch(err => alert(err.message));
      } else alert("Usuário não está logado!");
    });

    // ENVIAR VERIFICAÇÃO DE EMAIL
    document.getElementById('sendVerificationBtn').addEventListener('click', () => {
      if(auth.currentUser) {
        sendEmailVerification(auth.currentUser)
          .then(() => alert("Email de verificação enviado!"))
          .catch(err => alert(err.message));
      } else alert("Usuário não está logado!");
    });

    // REDEFINIR SENHA
    document.getElementById('resetPasswordBtn').addEventListener('click', () => {
      const email = prompt("Digite seu email para redefinir a senha:");
      if(!email) return;
      sendPasswordResetEmail(auth, email)
        .then(() => alert("Email de redefinição enviado!"))
        .catch(err => alert(err.message));
    });

    // LOGOUT
    document.getElementById('logoutBtn').addEventListener('click', () => {
      signOut(auth)
        .then(() => {
          alert("Desconectado com sucesso!");
          window.location.href = 'auth.html';
        })
        .catch(err => alert(err.message));
    });

    // BOTÃO DE VOLTAR
    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // ENTER PARA LOGIN/REGISTRO
    document.addEventListener("keypress", (e) => {
      if(e.key === "Enter") {
        if(document.activeElement === document.getElementById('loginEmail') || 
           document.activeElement === document.getElementById('loginPassword')) {
          document.getElementById('loginBtn').click();
        }
        if(document.activeElement === document.getElementById('registerEmail') || 
           document.activeElement === document.getElementById('registerPassword')) {
          document.getElementById('registerBtn').click();
        }
      }
    });
  </script>
</body>
</html>
