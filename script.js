const API_URL = "https://script.google.com/macros/s/AKfycbxXqv0utkYTFIw6hz-v5i_JL99Yqs5DCZn9skx4Bu3ZQN5Mxwf6p-WIhTiOqCge-iTPmg/exec";
const jsConfetti = typeof JSConfetti !== "undefined" ? new JSConfetti() : null;

let transacoes = JSON.parse(localStorage.getItem("finanzen_transacoes_backup") || "[]");

document.addEventListener("DOMContentLoaded", () => {
    // 1. AUTENTICAÇÃO E PERFIL DO UTILIZADOR
    const usuarioSalvo = localStorage.getItem("usuario_finanzen");
    if (!usuarioSalvo) {
        window.location.href = "login.html";
        return;
    }
    let usuario = JSON.parse(usuarioSalvo);

    // Preencher automaticamente os selects de dias de 1 a 31
    const selectsDias = document.querySelectorAll("#dia-pagamento, #finan-dia, #mercado-dia, #eco-dia");
    selectsDias.forEach(select => {
        if (select && select.children.length === 0) {
            for (let i = 1; i <= 31; i++) {
                const opt = document.createElement("option");
                opt.value = i;
                opt.innerText = `Dia ${i}`;
                select.appendChild(opt);
            }
        }
    });

    // Controlar campos de parcelamento no formulário de financiamento
    const selectTipoFinan = document.getElementById("finan-tipo-conta");
    const camposParcelas = document.getElementById("campos-parcelamento-cartao");
    if (selectTipoFinan && camposParcelas) {
        selectTipoFinan.addEventListener("change", () => {
            if (selectTipoFinan.value === "parcelado") {
                camposParcelas.style.display = "block";
            } else {
                camposParcelas.style.display = "none";
            }
        });
    }

    function getSimboloMoeda() { return usuario.moeda || "R$"; }

    function formatarGrana(val) {
        const simbolo = getSimboloMoeda();
        const num = parseFloat(val) || 0;
        return `${simbolo} ${num.toFixed(2).replace(".", ",")}`;
    }

    function atualizarDadosPerfilDisplay() {
        const headerTitle = document.querySelector(".top-header h1");
        if (headerTitle && usuario.nome) {
            headerTitle.innerText = `Olá, ${usuario.nome.split(" ")[0]} 👋`;
        }
        const userNameEl = document.querySelector(".user-info .name");
        if (userNameEl && usuario.nome) {
            userNameEl.innerText = usuario.nome;
        }
        const avatarEl = document.querySelector(".avatar");
        if (avatarEl) {
            const emojiSalvo = localStorage.getItem(`finanzen_avatar_${usuario.email}`);
            if (emojiSalvo) {
                avatarEl.innerText = emojiSalvo;
                avatarEl.style.fontSize = "1.4rem";
            }
        }
    }
    atualizarDadosPerfilDisplay();

    // 2. MODAL DE EDIÇÃO DE PERFIL
    const modalPerfil = document.getElementById("modal-editar-perfil");
    const btnClosePerfil = document.getElementById("btn-close-perfil-modal");
    const btnCancelarPerfil = document.getElementById("btn-cancelar-perfil");
    const formPerfil = document.getElementById("form-editar-perfil");
    const cardPerfilVisual = document.querySelector(".user-profile-card");

    const inputPerfilNome = document.getElementById("perfil-nome");
    const inputPerfilSalario = document.getElementById("perfil-salario");
    const selectPerfilMoeda = document.getElementById("perfil-moeda");
    const inputPerfilTeto = document.getElementById("perfil-teto");
    const selectPerfilDiaInicio = document.getElementById("perfil-dia-inicio");
    const btnExportarDados = document.getElementById("btn-exportar-dados");
    
    const avatarPreviewDisplay = document.getElementById("perfil-avatar-preview-display");
    const headerNomeDisplay = document.getElementById("perfil-header-nome-display");

    let emojiSelecionadoTemp = localStorage.getItem(`finanzen_avatar_${usuario.email}`) || "🐸";

    if (cardPerfilVisual && modalPerfil) {
        cardPerfilVisual.addEventListener("click", (e) => {
            if (e.target.closest("#btnConfirmLogout")) return;
            
            if (inputPerfilNome) inputPerfilNome.value = usuario.nome || "";
            if (inputPerfilSalario) inputPerfilSalario.value = usuario.salarioBase || "";
            if (selectPerfilMoeda) selectPerfilMoeda.value = usuario.moeda || "R$";
            if (inputPerfilTeto) inputPerfilTeto.value = usuario.tetoGastos || "";
            if (selectPerfilDiaInicio) selectPerfilDiaInicio.value = usuario.diaInicioCiclo || "1";

            const emojiSalvo = localStorage.getItem(`finanzen_avatar_${usuario.email}`) || "🐸";
            emojiSelecionadoTemp = emojiSalvo;

            if (avatarPreviewDisplay) avatarPreviewDisplay.innerText = emojiSalvo;
            if (headerNomeDisplay) headerNomeDisplay.innerText = usuario.nome ? `Perfil de ${usuario.nome.split(" ")[0]}` : "Configurações de Perfil";

            document.querySelectorAll(".emoji-card").forEach(card => {
                card.classList.toggle("selected", card.getAttribute("data-emoji") === emojiSalvo);
            });

            modalPerfil.style.display = "flex";
        });
    }

    function fecharModalPerfil() { if (modalPerfil) modalPerfil.style.display = "none"; }
    if (btnClosePerfil) btnClosePerfil.addEventListener("click", fecharModalPerfil);
    if (btnCancelarPerfil) btnCancelarPerfil.addEventListener("click", fecharModalPerfil);
    window.addEventListener("click", (e) => { if (modalPerfil && e.target === modalPerfil) fecharModalPerfil(); });

    document.querySelectorAll(".emoji-card").forEach(btn => {
        btn.addEventListener("click", () => {
            emojiSelecionadoTemp = btn.getAttribute("data-emoji");
            document.querySelectorAll(".emoji-card").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            if (avatarPreviewDisplay) avatarPreviewDisplay.innerText = emojiSelecionadoTemp;
        });
    });

    if (formPerfil) {
        formPerfil.addEventListener("submit", (e) => {
            e.preventDefault();
            const novoNome = inputPerfilNome ? inputPerfilNome.value.trim() : usuario.nome;
            if (novoNome) {
                usuario.nome = novoNome;
                if (inputPerfilSalario) usuario.salarioBase = parseFloat(inputPerfilSalario.value) || 0;
                if (selectPerfilMoeda) usuario.moeda = selectPerfilMoeda.value || "R$";
                if (inputPerfilTeto) usuario.tetoGastos = parseFloat(inputPerfilTeto.value) || 0;
                if (selectPerfilDiaInicio) usuario.diaInicioCiclo = selectPerfilDiaInicio.value || "1";

                localStorage.setItem("usuario_finanzen", JSON.stringify(usuario));
                localStorage.setItem(`finanzen_avatar_${usuario.email}`, emojiSelecionadoTemp);

                atualizarDadosPerfilDisplay();
                atualizarTodasPaginas();
                fecharModalPerfil();
                if (jsConfetti) jsConfetti.addConfetti({ emojis: [emojiSelecionadoTemp, '✨', '⚙️'], confettiNumber: 15 });
            }
        });
    }

    if (btnExportarDados) {
        btnExportarDados.addEventListener("click", () => {
            const backupData = { usuario: usuario, transacoes: transacoes, exportadoEm: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `FinanZen_Backup_${(usuario.nome || 'Usuario').replace(/\s+/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // 3. LOGOUT E TUTORIAL
    const btnConfirmLogout = document.getElementById("btnConfirmLogout");
    const modalLogout = document.getElementById("modal-confirm-logout");
    const btnCancelarLogout = document.getElementById("btn-cancelar-logout");
    const btnAceitarLogout = document.getElementById("btn-aceitar-logout");

    if (btnConfirmLogout && modalLogout) {
        btnConfirmLogout.addEventListener("click", () => { modalLogout.style.display = "flex"; });
    }
    if (btnCancelarLogout) {
        btnCancelarLogout.addEventListener("click", () => { modalLogout.style.display = "none"; });
    }
    if (btnAceitarLogout) {
        btnAceitarLogout.addEventListener("click", () => {
            localStorage.removeItem("usuario_finanzen");
            window.location.href = "login.html";
        });
    }
    window.addEventListener("click", (e) => {
        if (modalLogout && e.target === modalLogout) { modalLogout.style.display = "none"; }
    });

    const modalTutorial = document.getElementById("modal-tutorial");
    const btnProximo = document.getElementById("btn-tutorial-proximo");
    const btnPular = document.getElementById("btn-tutorial-pular");
    const tutTitulo = document.getElementById("tutorial-titulo");
    const tutTexto = document.getElementById("tutorial-texto");
    const tutEmoji = document.getElementById("tutorial-emoji");
    const tutDots = document.querySelectorAll("#tutorial-dots .dot");

    let passoAtual = 0;
    const passosTutorial = [
        { emoji: "🐸", titulo: "Olá, bem-vindo ao FinanZen!", texto: "Este é o seu painel financeiro inteligente. Aqui acompanha as suas receitas, dinheiro guardado e a sua sobra mensal em tempo real." },
        { emoji: "💡", titulo: "Dicas do FinanSapo", texto: "O nosso mascote analisa as suas finanças e avisa automaticamente se estiver a aproximar-se do teto de gastos ou se poupou bem!" },
        { emoji: "💳", titulo: "Gestão por Categorias", texto: "Utilize o menu lateral para alternar entre Financiamentos, Supermercado e Caixinhas de Economias." },
        { emoji: "⚙️", titulo: "O seu Perfil e Avatar", texto: "Clique no seu cartão de perfil na barra lateral para mudar o seu avatar, definir a moeda (€, R$, $) ou exportar backups!" }
    ];

    function atualizarPassoTutorial() {
        const p = passosTutorial[passoAtual];
        if (tutEmoji) tutEmoji.innerText = p.emoji;
        if (tutTitulo) tutTitulo.innerText = p.titulo;
        if (tutTexto) tutTexto.innerText = p.texto;
        if (btnProximo) btnProximo.innerText = passoAtual === passosTutorial.length - 1 ? "Começar 🚀" : "Avançar ➔";
        tutDots.forEach((dot, index) => {
            dot.style.background = index === passoAtual ? "#10b981" : "rgba(255,255,255,0.2)";
        });
    }

    const jaViuTutorial = localStorage.getItem(`finanzen_tutorial_${usuario.email}`);
    if (!jaViuTutorial && modalTutorial) {
        setTimeout(() => { modalTutorial.style.display = "flex"; atualizarPassoTutorial(); }, 800);
    }
    if (btnProximo) {
        btnProximo.addEventListener("click", () => {
            passoAtual++;
            if (passoAtual < passosTutorial.length) { atualizarPassoTutorial(); } else { fecharTutorial(); }
        });
    }
    if (btnPular) { btnPular.addEventListener("click", fecharTutorial); }
    function fecharTutorial() {
        if (modalTutorial) modalTutorial.style.display = "none";
        localStorage.setItem(`finanzen_tutorial_${usuario.email}`, "true");
        if (jsConfetti) jsConfetti.addConfetti({ emojis: ['🐸', '✨', '🎉'], confettiNumber: 20 });
    }

    // 4. SINCRONIZAÇÃO COM GOOGLE SHEETS
    async function carregarTransacoesGoogleSheets() {
        const dadosLocais = localStorage.getItem("finanzen_transacoes_backup");
        if (dadosLocais) {
            try {
                transacoes = JSON.parse(dadosLocais).map(t => ({
                    ...t,
                    valor: parseFloat(t.valor) || 0,
                    pago: t.pago === true || t.pago === "true" || t.pago === "TRUE",
                    tipoFinanciamento: t.tipoFinanciamento || "fixa",
                    parcelaAtual: parseInt(t.parcelaAtual) || 1,
                    totalParcelas: parseInt(t.totalParcelas) || 1
                }));
            } catch(e) { transacoes = []; }
        }
        atualizarTodasPaginas();

        try {
            if (API_URL && API_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
                const response = await fetch(API_URL, {
                    method: "POST", redirect: "follow",
                    body: JSON.stringify({ action: "getTransacoes", emailUsuario: usuario.email })
                });
                const res = await response.json();
                if (res.status === "success" && res.transacoes) {
                    transacoes = res.transacoes.map(t => ({
                        ...t,
                        valor: parseFloat(t.valor) || 0,
                        pago: t.pago === true || t.pago === "true" || t.pago === "TRUE",
                        tipoFinanciamento: t.tipoFinanciamento || "fixa",
                        parcelaAtual: parseInt(t.parcelaAtual) || 1,
                        totalParcelas: parseInt(t.totalParcelas) || 1
                    }));
                    localStorage.setItem("finanzen_transacoes_backup", JSON.stringify(transacoes));
                    atualizarTodasPaginas();
                }
            }
        } catch (err) {
            console.warn("A usar dados locais salvos no navegador.");
        }
    }

    function salvarEAtualizarLocalmente() {
        localStorage.setItem("finanzen_transacoes_backup", JSON.stringify(transacoes));
        atualizarTodasPaginas();
    }

    function atualizarTodasPaginas() {
        try { renderizarIndex(); } catch(e){}
        try { renderizarFinanciamentos(); } catch(e){}
        try { renderizarMercado(); } catch(e){}
        try { renderizarEconomias(); } catch(e){}
        try { atualizarGraficos(); } catch(e){}
        if (window.lucide) { try { lucide.createIcons(); } catch(e){} }
    }

    // 5. GRÁFICOS
    let chartCategoriasInstance = null;
    function atualizarGraficos() {
        if (typeof Chart === "undefined") return;
        const canvasCat = document.getElementById("graficoCategorias");
        if (canvasCat) {
            const categoriasSoma = {};
            transacoes.forEach(d => {
                const nomeCat = d.categoria ? d.categoria.replace(/^[^\w\s]+\s*/, '') : 'Outros';
                categoriasSoma[nomeCat] = (categoriasSoma[nomeCat] || 0) + (parseFloat(d.valor) || 0);
            });
            if (chartCategoriasInstance) chartCategoriasInstance.destroy();
            chartCategoriasInstance = new Chart(canvasCat.getContext("2d"), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categoriasSoma).length ? Object.keys(categoriasSoma) : ['Sem lançamentos'],
                    datasets: [{ data: Object.values(categoriasSoma).length ? Object.values(categoriasSoma) : [1], backgroundColor: ['#10b981', '#38bdf8', '#7c3aed', '#f59e0b', '#ef4444', '#ec4899'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } } }
            });
        }
    }

    // 6. FINANSAPO
    function atualizarDicaMascote(totalRec, totalEconomias) {
        const elDica = document.getElementById("mascote-texto-dica");
        const elEmoji = document.getElementById("mascote-emoji");
        const elTitulo = document.getElementById("mascote-titulo");
        if (!elDica) return;

        const sobra = totalRec - totalEconomias;
        const teto = usuario.tetoGastos || 0;
        let frase = `A tua sobra estimada é de ${formatarGrana(sobra)}. Que tal enviar uma parte direta para as tuas Caixinhas? 🔒`;

        if (teto > 0 && (totalRec - sobra) > teto) {
            if (elEmoji) elEmoji.innerText = "🚨";
            if (elTitulo) elTitulo.innerText = "Alerta Vermelho do FinanSapo";
            frase = `Ribbit! Atenção! Já ultrapassaste o teu teto de gastos (${formatarGrana(teto)}) deste ciclo.`;
        } else if (totalEconomias > 500) {
            if (elEmoji) elEmoji.innerText = "🤑";
            if (elTitulo) elTitulo.innerText = "FinanSapo Orgulhoso";
            frase = `Sensacional! Já tens ${formatarGrana(totalEconomias)} guardados. O teu 'eu' do futuro agradece! 🚀`;
        }
        elDica.innerText = frase;
    }

    const btnNovaDica = document.getElementById("btn-nova-dica");
    if (btnNovaDica) {
        btnNovaDica.addEventListener("click", () => {
            let totalRec = 0, totalEco = 0;
            transacoes.forEach(t => {
                const val = parseFloat(t.valor) || 0;
                if (t.categoria && t.categoria.includes("Economias")) totalEco += val;
                else if (t.tipo === "receita") totalRec += val;
            });
            atualizarDicaMascote(totalRec, totalEco);
        });
    }

    // 7. RENDERIZAÇÃO DAS PÁGINAS
    let valoresVisiveis = true;
    const btnPrivacy = document.getElementById("btn-privacy");
    if (btnPrivacy) {
        btnPrivacy.addEventListener("click", () => { valoresVisiveis = !valoresVisiveis; atualizarTodasPaginas(); });
    }
    const btnThemeToggle = document.getElementById("btn-theme-toggle");
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener("click", () => { document.body.classList.toggle("light-theme"); });
    }

    function renderizarIndex() {
        const lista = document.getElementById("lista-transacoes");
        if (!lista) return;
        lista.innerHTML = "";
        let totalReceita = 0, totalEconomias = 0;

        if (transacoes.length === 0) {
            lista.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px;">Nenhum lançamento registrado.</p>`;
        } else {
            transacoes.forEach(t => {
                const val = parseFloat(t.valor) || 0;
                if (t.categoria && (t.categoria.includes("Economias") || t.categoria.includes("Caixinha"))) totalEconomias += val;
                else if (t.tipo === "receita") totalReceita += val;

                lista.innerHTML += `
                    <li class="transacao-item ${t.pago ? 'item-pago' : ''}">
                        <div class="info">
                            <p class="titulo">${t.descricao}</p>
                            <span class="data">Dia ${t.dia} • ${t.categoria}</span>
                        </div>
                        <div class="acoes-item">
                            <button class="btn-status-pago ${t.pago ? 'is-pago' : ''}" data-id="${t.id}">${t.pago ? '✓ Concluído' : 'Marcar'}</button>
                            <span class="valor-transacao ${t.tipo==='receita'?'positivo':'negativo'}">${valoresVisiveis ? formatarGrana(val) : '••••'}</span>
                            <button class="btn-action-sm btn-delete" data-id="${t.id}"><i data-lucide="trash-2" size="16"></i></button>
                        </div>
                    </li>`;
            });
        }

        const cardRec = document.getElementById("card-total-receita");
        const cardEco = document.getElementById("card-total-economias");
        const cardSobra = document.getElementById("card-saldo-sobra");
        if (cardRec) cardRec.innerText = valoresVisiveis ? formatarGrana(totalReceita) : "••••";
        if (cardEco) cardEco.innerText = valoresVisiveis ? formatarGrana(totalEconomias) : "••••";
        if (cardSobra) cardSobra.innerText = valoresVisiveis ? formatarGrana(totalReceita - totalEconomias) : "••••";

        atualizarDicaMascote(totalReceita, totalEconomias);
    }

    function renderizarFinanciamentos() {
        const lista = document.getElementById("lista-financiamentos");
        if (!lista) return;
        lista.innerHTML = "";
        const itensFixos = transacoes.filter(t => t.categoria && (t.categoria.includes("Financiamento") || t.categoria.includes("Contas Fixas") || t.categoria.includes("Cartão")));
        
        if (itensFixos.length === 0) {
            lista.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px;">Nenhum financiamento ou conta cadastrada.</p>`;
        } else {
            itensFixos.forEach(t => {
                const val = parseFloat(t.valor) || 0;
                const tipoFin = t.tipoFinanciamento || "fixa";
                
                if (tipoFin === "fixa") {
                    lista.innerHTML += `
                        <li class="transacao-item">
                            <div class="info">
                                <p class="titulo">${t.descricao}</p>
                                <span class="data">Vencimento: Dia ${t.dia} • <strong style="color: #38bdf8;">Conta Fixa Mensal 🔄</strong></span>
                            </div>
                            <div class="acoes-item">
                                <span class="negativo">${valoresVisiveis ? formatarGrana(val) : '••••'}</span>
                                <button class="btn-action-sm btn-delete" data-id="${t.id}"><i data-lucide="trash-2" size="16"></i></button>
                            </div>
                        </li>`;
                } else {
                    const atual = parseInt(t.parcelaAtual) || 1;
                    const total = parseInt(t.totalParcelas) || 1;
                    const mesesRestantes = Math.max(0, total - atual);

                    lista.innerHTML += `
                        <li class="transacao-item" style="display: flex; flex-direction: column; align-items: stretch; gap: 10px; padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div class="info">
                                    <p class="titulo">${t.descricao}</p>
                                    <span class="data">Vencimento: Dia ${t.dia} • Parcela <strong>${atual} de ${total}</strong></span>
                                </div>
                                <div class="acoes-item">
                                    <span class="negativo">${valoresVisiveis ? formatarGrana(val) : '••••'}</span>
                                    <button class="btn-action-sm btn-delete" data-id="${t.id}" title="Apagar"><i data-lucide="trash-2" size="16"></i></button>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
                                <span>✅ Pagas: <strong style="color: #f8fafc;">${atual}</strong> | Faltam: <strong style="color: #34d399;">${mesesRestantes} meses</strong></span>
                                <button class="btn-avancar-parcela" data-id="${t.id}">Avançar Parcela ➔</button>
                            </div>
                        </li>`;
                }
            });
        }
    }

    function renderizarMercado() {
        const lista = document.getElementById("lista-mercado");
        if (!lista) return;
        lista.innerHTML = "";
        const itensMercado = transacoes.filter(t => t.categoria && t.categoria.includes("Mercado"));
        if (itensMercado.length === 0) {
            lista.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px;">Nenhum gasto de mercado registado.</p>`;
        } else {
            itensMercado.forEach(t => {
                const val = parseFloat(t.valor) || 0;
                lista.innerHTML += `
                    <li class="transacao-item">
                        <div class="info"><p class="titulo">${t.descricao}</p><span class="data">Dia ${t.dia}</span></div>
                        <div class="acoes-item"><span class="negativo">${valoresVisiveis ? formatarGrana(val) : '••••'}</span><button class="btn-action-sm btn-delete" data-id="${t.id}"><i data-lucide="trash-2" size="16"></i></button></div>
                    </li>`;
            });
        }
    }

    function renderizarEconomias() {
        const container = document.getElementById("lista-caixinhas-cards");
        if (!container) return;
        container.innerHTML = "";
        const economias = transacoes.filter(t => t.categoria && t.categoria.includes("Economias"));
        if (economias.length === 0) {
            container.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px;">Nenhuma caixinha criada.</p>`;
        } else {
            economias.forEach(item => {
                const val = parseFloat(item.valor) || 0;
                container.innerHTML += `
                    <div class="caixinha-card">
                        <div class="caixinha-header"><span class="caixinha-titulo">🐷 ${item.descricao}</span></div>
                        <div class="caixinha-valores"><span class="caixinha-atual">${valoresVisiveis ? formatarGrana(val) : '••••'}</span></div>
                        <div class="caixinha-footer"><button class="btn-action-sm btn-delete" data-id="${item.id}">Apagar</button></div>
                    </div>`;
            });
        }
    }

    // 8. FORMULÁRIOS & EVENTOS DE CLIQUE
    const formTransacao = document.getElementById("form-transacao");
    if (formTransacao) {
        formTransacao.onsubmit = (e) => {
            e.preventDefault();
            const novaTransacao = {
                id: "id_" + Date.now(),
                descricao: document.getElementById("descricao").value,
                valor: parseFloat(document.getElementById("valor").value) || 0,
                dia: document.getElementById("dia-pagamento").value,
                categoria: document.getElementById("categoria").value,
                tipo: "receita",
                pago: false,
                tipoFinanciamento: "fixa", parcelaAtual: 1, totalParcelas: 1
            };
            transacoes.push(novaTransacao);
            salvarEAtualizarLocalmente();
            if (API_URL && API_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
                fetch(API_URL, { method: "POST", redirect: "follow", body: JSON.stringify({ action: "saveTransacao", emailUsuario: usuario.email, transacao: novaTransacao }) }).catch(()=>{});
            }
            formTransacao.reset();
        };
    }

    const formFinanciamento = document.getElementById("form-financiamento");
    if (formFinanciamento) {
        formFinanciamento.onsubmit = (e) => {
            e.preventDefault();
            const tipoFin = document.getElementById("finan-tipo-conta").value;
            const atual = parseInt(document.getElementById("finan-parcela-atual")?.value) || 1;
            const total = parseInt(document.getElementById("finan-total-parcelas")?.value) || 12;

            const novaTransacao = {
                id: "id_" + Date.now(),
                descricao: document.getElementById("finan-nome").value,
                valor: parseFloat(document.getElementById("finan-valor").value) || 0,
                dia: document.getElementById("finan-dia").value,
                categoria: "💳 Contas Fixas / Financiamento",
                tipo: "despesa",
                pago: false,
                tipoFinanciamento: tipoFin,
                parcelaAtual: atual,
                totalParcelas: total
            };
            transacoes.push(novaTransacao);
            salvarEAtualizarLocalmente();
            if (API_URL && API_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
                fetch(API_URL, { method: "POST", redirect: "follow", body: JSON.stringify({ action: "saveFinanciamento", emailUsuario: usuario.email, transacao: novaTransacao }) }).catch(()=>{});
            }
            formFinanciamento.reset();
        };
    }

    const formMercado = document.getElementById("form-mercado");
    if (formMercado) {
        formMercado.onsubmit = (e) => {
            e.preventDefault();
            const novaTransacao = {
                id: "id_" + Date.now(),
                descricao: document.getElementById("mercado-nome").value,
                valor: parseFloat(document.getElementById("mercado-valor").value) || 0,
                dia: document.getElementById("mercado-dia").value,
                categoria: "🛒 Mercado / Supermercado",
                tipo: "despesa",
                pago: false,
                tipoFinanciamento: "fixa", parcelaAtual: 1, totalParcelas: 1
            };
            transacoes.push(novaTransacao);
            salvarEAtualizarLocalmente();
            if (API_URL && API_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
                fetch(API_URL, { method: "POST", redirect: "follow", body: JSON.stringify({ action: "saveMercado", emailUsuario: usuario.email, transacao: novaTransacao }) }).catch(()=>{});
            }
            formMercado.reset();
        };
    }

    const formEconomias = document.getElementById("form-economias");
    if (formEconomias) {
        formEconomias.onsubmit = (e) => {
            e.preventDefault();
            const novaTransacao = {
                id: "id_" + Date.now(),
                descricao: document.getElementById("eco-nome").value,
                valor: parseFloat(document.getElementById("eco-valor").value) || 0,
                dia: document.getElementById("eco-dia").value,
                categoria: "🐷 Economias / Caixinha",
                tipo: "receita",
                pago: false,
                tipoFinanciamento: "fixa", parcelaAtual: 1, totalParcelas: 1
            };
            transacoes.push(novaTransacao);
            salvarEAtualizarLocalmente();
            if (API_URL && API_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
                fetch(API_URL, { method: "POST", redirect: "follow", body: JSON.stringify({ action: "saveEconomia", emailUsuario: usuario.email, transacao: novaTransacao }) }).catch(()=>{});
            }
            formEconomias.reset();
        };
    }

    document.body.addEventListener("click", (e) => {
        const btnDelete = e.target.closest(".btn-delete");
        const btnPago = e.target.closest(".btn-status-pago");
        const btnAvancar = e.target.closest(".btn-avancar-parcela");

        if (btnDelete) {
            const id = btnDelete.getAttribute("data-id");
            if (confirm("Deseja apagar este item?")) {
                transacoes = transacoes.filter(t => t.id != id);
                salvarEAtualizarLocalmente();
            }
        }
        if (btnPago) {
            const id = btnPago.getAttribute("data-id");
            const item = transacoes.find(t => t.id == id);
            if (item) {
                item.pago = !item.pago;
                salvarEAtualizarLocalmente();
            }
        }
        if (btnAvancar) {
            const id = btnAvancar.getAttribute("data-id");
            const item = transacoes.find(t => t.id == id);
            if (item) {
                if (item.parcelaAtual < item.totalParcelas) {
                    item.parcelaAtual++;
                    salvarEAtualizarLocalmente();
                    if (jsConfetti) jsConfetti.addConfetti({ emojis: ['💳', '✨'], confettiNumber: 15 });
                } else {
                    alert("Parabéns! Este financiamento já chegou à última parcela.");
                }
            }
        }
    });

    carregarTransacoesGoogleSheets();
});