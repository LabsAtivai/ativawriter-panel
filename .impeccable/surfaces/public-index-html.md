---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/style.css","public/app.js"]
---

## Scope & Mode

Surface: painel principal do AtivaWriter Panel (`public/index.html`, `public/style.css`, `public/app.js`) — telas de login + painel de geração. Modo: Operate (ferramenta de trabalho, não produto client-facing).

## Audience, job, action, proof, constraints

- Equipe interna da Ativa.ai (SDRs), primeiro validador SDR remoto — usa a ferramenta várias vezes por dia, lado a lado com MailHub/webmail.
- Tarefa: colar print ou texto de e-mail recebido → opcionalmente preencher contexto → gerar resposta com IA → copiar e colar no envio manual.
- Nenhum dado real de cliente disponível como conteúdo de exemplo — qualquer exemplo nas telas deve ser claramente fictício.
- Restrições técnicas: HTML/CSS/JS vanilla, sem build step, sem framework, sem banco (stateless), tema único escuro, mobile não é prioridade.

## Direction contract

**THESIS:** O painel é uma mesa de copydesk — despacho bruto entra à esquerda, copy revisada sai à direita, marcas de lápis vermelho mostram a edição. Recusa o cartão SaaS centralizado com botão gradiente que toda ferramenta de IA de escrita usa.

**OWN-WORLD:** Fundo papel-jornal/creme (#f0ece0 claro sobre base #1a1a18 — ver nota de tema abaixo), tinta de prensa quase-preta (#1a1a18) pro texto, vermelho de lápis (#c0392b) como único accent — ação primária e marcas de edição —, cinza de teletipo (#8a8a82) pra meta-texto. Tipografia: face condensada/slab pra headers e rótulos (estilo carimbo de dateline de agência de notícias), face de datilografia/monoespaçada pro corpo e textareas (parece copy datilografada). Componentes: painéis como folhas de papel com faixa de cabeçalho impressa (estilo masthead: "ATIVAWRITER · MESA DE DESPACHO" + timestamp), divisores como linhas finas, nunca cartão arredondado; textareas com textura sutil de papel e fonte de datilografia; ação "Gerar resposta" como um carimbo circulado a lápis vermelho, não botão gradiente arredondado; resultado mostrado com marca de edição visível (régua vertical vermelha na margem, como marcação de copydesk); botão "Copiar" como carimbo de borracha com micro-interação de "batida" de carimbo.

**STORY:** O SDR entende na hora: alimento a mesa com material bruto (print/texto), a mesa devolve copy pronta pra imprensa, eu mesmo despacho. Acredita que é ferramenta séria e rápida — mesa de redação sob deadline — não brinquedo de chatbot. Age: cola, confere o cabeçalho de wire confirmando a entrada, aperta o carimbo pra gerar, vê a copy "arquivada" no resultado, copia.

**FIRST VIEWPORT:** Fundo creme/jornal full-bleed sobre tema escuro geral (a mesa de trabalho é a área clara dentro do dark shell). Topo: faixa de masthead full-width — "ATIVAWRITER · MESA DE DESPACHO" em caixa-alta condensada, linha fina abaixo, leitura de status/horário tipo timestamp de wire no canto superior direito. Corpo em duas colunas (desktop): coluna esquerda "DESPACHO RECEBIDO" — dropzone de print estilo foto grampeada (marcas de canto tipo clipe), textarea de texto colado estilo papel datilografado. Coluna direita, mais estreita, "NOTAS DA MESA" — assinatura / contexto do cliente / respostas anteriores como fichas pautadas empilhadas. Abaixo das duas colunas, full-width: barra de ação com o carimbo vermelho "GERAR RESPOSTA" como primário e "NOVA" como marca secundária menor. Resultado aparece abaixo como folha "COPY APROVADA" — bloco de texto estilo datilografado com régua vertical vermelha na margem, botão carimbo "COPIAR" no canto inferior direito com confirmação estilo carimbo de tinta "COPIADO".

**FORM:** Mesa de Copydesk / Wire Editor — posição 1 de 7 na minha lista ordenada por ressonância (mesa de copydesk, despacho de telex, cabine de intérprete, quadro de despacho ATC [sorteado pelo roll], triagem postal, terminal, câmara escura). Escolhida via IMPECCABLE'S PICK sobre a atribuição do sorteio (Dispatch Board, índice 4) na mesa de decisão. Seed key 56a992a1.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- Tema: produto confirmou tema único escuro para o shell da ferramenta; a mesa de copydesk em si (papel creme) fica como área de trabalho clara dentro desse shell escuro — tratar como página impressa sob luz de mesa, não como troca de tema global.
- Sem tooling de geração de imagem disponível nesta sessão — build code-led, sem comp aprovado; texturas de papel/grão são CSS/SVG, não raster gerado.
