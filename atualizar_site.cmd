@echo off
title Atualização do MemoZap no Firebase Hosting
setlocal

:: ===== Configurações =====
set PROJECT_DIR=C:\Users\SeuUsuario\Desktop\MemoZap
set REQUIRED_FILES=index.html;contatos.html;style.css;chat.js;firebaseConfig.js;upload.js
set ASSETS_DIR=%PROJECT_DIR%\assets

:: ===== Entrar na pasta do projeto =====
cd /d "%PROJECT_DIR%" || (
    echo ERRO: Pasta do projeto nao encontrada!
    pause
    exit /b
)

echo ==============================
echo Verificando arquivos essenciais
echo ==============================

set MISSING=
for %%F in (%REQUIRED_FILES%) do (
    if not exist "%%F" (
        echo FALTA: %%F
        set MISSING=1
    )
)

if not exist "%ASSETS_DIR%" (
    echo FALTA: pasta assets
    set MISSING=1
)

if defined MISSING (
    echo.
    echo ERRO: Alguns arquivos ou pastas estao faltando! Corrija antes de continuar.
    pause
    exit /b
) else (
    echo Todos os arquivos essenciais presentes.
)

echo.
echo ==============================
echo Testando site localmente
echo ==============================
firebase serve || (
    echo ERRO: Nao foi possivel iniciar o servidor local.
    pause
    exit /b
)

echo.
echo ==============================
echo Fazendo deploy no Firebase Hosting
echo ==============================
firebase deploy --only hosting || (
    echo ERRO: Deploy falhou.
    pause
    exit /b
)

echo.
echo Deploy concluido com sucesso! Acesse seu site em:
firebase open hosting:site
pause
