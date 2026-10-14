const API_URL = "https://script.google.com/macros/s/AKfycbxXqv0utkYTFIw6hz-v5i_JL99Yqs5DCZn9skx4Bu3ZQN5Mxwf6p-WIhTiOqCge-iTPmg/exec";

function mostrarErro(msg) {
    const box = document.getElementById("auth-alert-box");
    if (box) {
        box.innerText = msg;
        box.style.display = "block";
        setTimeout(() => { box.style.display = "none"; }, 4000);
    } else {
        alert(msg);
    }
}

function alternarAba(tipo) {
    const btnLogin = document.getElementById("tab-btn-login");
    const btnCadastro = document.getElementById("tab-btn-cadastro");
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");
    const alertBox = document.getElementById("auth-alert-box");
    if (alertBox) alertBox.style.display = "none";

    if (tipo === 'login') {
        btnLogin.classList.add("active");
        btnCadastro.classList.remove("active");
        formLogin.style.display = "block";
        formCadastro.style.display = "none";
    } else {
        btnCadastro.classList.add("active");
        btnLogin.classList.remove("active");
        formCadastro.style.display = "block";
        formLogin.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim().toLowerCase();
            const senha = document.getElementById("login-senha").value;

            const usuarioSalvo = localStorage.getItem("usuario_finanzen");
            if (usuarioSalvo) {
                const dadosUser = JSON.parse(usuarioSalvo);
                if (dadosUser.email.toLowerCase() === email) {
                    if (dadosUser.senha && dadosUser.senha !== senha) {
                        mostrarErro("Palavra-passe incorreta. Tente novamente.");
                        return;
                    }
                    window.location.href = "index.html";
                    return;
                }
            }

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    redirect: "follow",
                    body: JSON.stringify({ action: "login", email, senha })
                });
                const res = await response.json();

                if (res.status === "success" && res.user) {
                    localStorage.setItem("usuario_finanzen", JSON.stringify(res.user));
                    window.location.href = "index.html";
                } else {
                    mostrarErro(res.message || "Conta não encontrada ou dados incorretos.");
                }
            } catch (err) {
                console.error(err);
                mostrarErro("Erro ao conectar com o banco de dados da planilha!");
            }
        });
    }

    const formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("cadastro-nome").value.trim();
            const email = document.getElementById("cadastro-email").value.trim().toLowerCase();
            const senha = document.getElementById("cadastro-senha").value;
            const moeda = document.getElementById("cadastro-moeda").value;
            const teto = parseFloat(document.getElementById("cadastro-teto").value) || 0;

            if (senha.length < 6) {
                mostrarErro("A palavra-passe precisa de ter pelo menos 6 carateres.");
                return;
            }

            const novoUsuario = {
                nome: nome,
                email: email,
                senha: senha,
                salarioBase: 0,
                moeda: moeda,
                tetoGastos: teto,
                diaInicioCiclo: "1"
            };

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    redirect: "follow",
                    body: JSON.stringify({ action: "register", nome, email, senha })
                });
                const res = await response.json();

                if (res.status === "success") {
                    localStorage.setItem("usuario_finanzen", JSON.stringify(res.user || novoUsuario));
                    if (typeof JSConfetti !== "undefined") {
                        const confetti = new JSConfetti();
                        confetti.addConfetti({ emojis: ['🐸', '✨', '🎉'], confettiNumber: 25 });
                    }
                    setTimeout(() => { window.location.href = "index.html"; }, 800);
                } else {
                    mostrarErro(res.message || "Erro ao criar conta.");
                }
            } catch (err) {
                console.error(err);
                localStorage.setItem("usuario_finanzen", JSON.stringify(novoUsuario));
                window.location.href = "index.html";
            }
        });
    }
});