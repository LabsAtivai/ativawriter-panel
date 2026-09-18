# Spec — AtivaWriter Standalone (painel web de resposta com IA)

Status: validada — v1 em desenvolvimento (código inicial implementado em 2026-09-15).
Criado em: 2026-09-11.
Relacionado: [[project_ativawriter_rollout]] (memória), `mailhub/docs/ativawriter-rollout.md`.

## Contexto e motivação

O rollout do AtivaWriter dentro do próprio MailHub depende de indexação (RAG)
sobre a pasta Sent de cada conta, e o backfill em massa dessa indexação foi
planejado para rodar coordenado com a migração para Mailcow (ver
[[project_mailcow_migration]]) — hoje adiada, sem previsão. Enquanto isso, a
equipe já opera respondendo e-mails direto no MailHub via webmail/cPanel, sem
o botão "Gerar resposta com IA" disponível de forma confiável em todas as
contas.

Em vez de esperar o Mailcow, a decisão é construir uma ferramenta **separada,
independente do MailHub**, que ofereça a mesma capacidade de geração de
resposta do AtivaWriter, mas alimentada manualmente (print de tela ou texto
colado) em vez de RAG automático sobre IMAP.

## Objetivo

Uma página web única onde alguém:
1. Cola/anexa print(s) de uma conversa de e-mail (do MailHub ou de qualquer
   webmail).
2. Opcionalmente cola texto adicional (corpo do e-mail, contexto).
3. Clica em "Gerar resposta".
4. Recebe um rascunho de resposta pronto, no mesmo estilo/tom do AtivaWriter.
5. Copia com um botão e cola manualmente no MailHub/webmail pra enviar.

### O que NÃO é (fora de escopo v1)

- Não envia e-mail nenhum — é só geração de texto, envio continua manual.
- Não integra com IMAP/SMTP, nem com o banco do MailHub.
- Não faz RAG automático sobre histórico de Sent (sem acesso a esse dado
  fora do MailHub). Contexto de cliente e respostas anteriores, se usados,
  são colados manualmente pelo usuário.
- Não é multiusuário com contas individuais na v1 (ver "Autenticação" abaixo).

## Usuários

Equipe interna da Ativa.ai que hoje responde e-mails de prospecção/cadência
manualmente. Uso interno, não é produto client-facing.

## Requisitos funcionais

**RF-01 — Entrada por print(s)**
Upload de imagem (drag-and-drop, seleção de arquivo, ou colar do clipboard
com Ctrl+V) de um ou mais screenshots da conversa. Múltiplos prints
representam páginas/mensagens diferentes da mesma thread, em ordem.

**RF-02 — Entrada por texto**
Campo de texto livre para colar conteúdo do e-mail recebido (alternativa ou
complemento ao print — útil quando o texto já está disponível, sem precisar
tirar print).

**RF-03 — Campos de contexto opcionais**
- Assinatura (texto livre, reaproveita entre gerações via localStorage do
  navegador — não precisa redigitar toda vez).
- Contexto do cliente (texto livre, colado manualmente — equivalente ao
  `ClientProfile` do MailHub, mas sem persistência em banco).
- Exemplos de respostas anteriores (texto livre opcional, colado à mão —
  equivalente ao `referenceBlock` do RAG, mas manual).

**RF-04 — Geração**
Botão "Gerar resposta" envia print(s) + texto + campos de contexto pro
backend, que chama a OpenAI reaproveitando o **mesmo system prompt do
AtivaWriter** (`generateReplyText` em
`mailhub/apps/backend/src/modules/ai/openaiClient.ts`), adaptado para aceitar
imagem como evidência de entrada quando não há texto colado.

**RF-05 — Resultado e cópia**
Resposta gerada aparece em uma área de texto editável (usuário pode ajustar
antes de copiar). Botão "Copiar" copia pro clipboard. Feedback visual de
"copiado".

**RF-06 — Estado de carregamento e erro**
Indicador de "gerando..." durante a chamada. Erros da OpenAI (rate limit,
sem imagem legível, etc.) exibidos de forma clara, sem travar a página.

**RF-07 — Nova geração**
Botão "Limpar" / "Nova resposta" reseta prints e texto, mantendo assinatura
salva (RF-03).

## Fluxo de uso

```
1. Usuário abre a página (login simples, ver Autenticação)
2. Cola print(s) da conversa (Ctrl+V) e/ou cola texto do e-mail
3. (Opcional) preenche contexto do cliente / respostas anteriores
4. Clica "Gerar resposta"
5. Frontend envia multipart (imagens + campos texto) para o backend
6. Backend monta prompt (system = AtivaWriter) e chama OpenAI Responses API
   com input multimodal (imagem + texto)
7. Backend retorna texto da resposta
8. Frontend mostra resposta editável + botão Copiar
9. Usuário copia e cola no MailHub/webmail pra enviar manualmente
```

## Arquitetura proposta

Ferramenta standalone, repositório/deploy próprio — não entra no monorepo
lógico do MailHub (backend/worker/frontend), só reaproveita o texto do
system prompt como referência.

```
ativawriter-panel/
  server/        Express mínimo — 1 rota de auth, 1 rota de geração
  public/        HTML + JS vanilla (sem build step) — 1 página só
```

- **Frontend**: HTML + JS puro (sem Vue/build), pra manter deploy trivial
  (1 container, sem etapa de build). Justifica-se pelo escopo pequeno (1
  página, poucos campos) — reavaliar se o escopo crescer.
- **Backend**: Express (Node), 1 endpoint `POST /api/generate-reply` que:
  - Recebe multipart/form-data (imagens + campos texto).
  - Monta `input` multimodal pra OpenAI Responses API: cada imagem como
    `image_url` (base64 ou upload temporário), texto colado como texto.
  - Usa o mesmo `systemInstructions` do AtivaWriter (copiado/adaptado de
    `openaiClient.ts`, com uma seção nova de instrução: "se houver imagem,
    leia o conteúdo da conversa nela antes de responder").
  - Retorna `{ response: string }`.
  - Guarda a `OPENAI_API_KEY` só no backend — nunca exposta ao frontend.
- **Sem banco de dados na v1** — stateless. Nada de e-mail, imagem ou
  resposta gerada é persistido no servidor após a resposta HTTP.

### Por que reusar o prompt em vez de importar o módulo do MailHub

MailHub é 3 repositórios separados sem `packages/shared` (ver
`mailhub/CLAUDE.md`). Importar `openaiClient.ts` diretamente criaria
acoplamento entre repos independentes só por causa de uma string de prompt.
Mais simples copiar o `systemInstructions` pro novo projeto e manter os dois
sincronizados manualmente — aceitável dado que o prompt muda pouco. Se
divergirem no futuro, extrair para um pacote compartilhado vira decisão de
pós-MVP, igual ao resto do roadmap do MailHub.

## Autenticação

V1: uma senha compartilhada única pro time (variável de ambiente, comparada
num form simples, sessão via cookie assinado). Não é multiusuário, não tem
cadastro. Suficiente pra uma ferramenta interna de uso pontual.

## Segurança e privacidade

- Prints de conversa podem conter dados de clientes/leads — **não
  persistir** imagens nem texto no servidor além do tempo da requisição.
- HTTPS obrigatório em produção (mesma rede/reverse proxy do MailHub, ver
  Deploy).
- Rate limiting básico no endpoint de geração (evitar custo descontrolado de
  OpenAI, mesmo gap identificado em [[project_ativawriter_rollout]] pro
  MailHub — vale aqui também).
- Sem log do conteúdo das imagens/textos em produção; log estruturado
  (Pino, seguindo padrão do MailHub) só com metadados: timestamp, tamanho,
  sucesso/erro, sem corpo do prompt nem resposta.

## Stack técnica

- Node.js + Express (consistente com o resto do ecossistema MailHub).
- Sem Prisma/Postgres — não precisa.
- Sem Redis — não precisa (sem fila, sem realtime).
- OpenAI Responses API (`gpt-4.1-mini` ou modelo com suporte a visão —
  confirmar qual modelo atual da conta cobre input de imagem com boa leitura
  de texto de screenshot).

## Deploy

Container único (Dockerfile simples, sem multi-stage complexo), na mesma
rede Docker `ativaai` e mesmo Portainer do MailHub, mas como serviço
independente — pode subir/cair sem afetar backend/worker/frontend do
MailHub.

## Critérios de aceite (v1)

- [v] Usuário loga com senha compartilhada.
- [v] Usuário cola 1+ prints (Ctrl+V ou upload) de uma conversa.
- [v] Usuário opcionalmente cola texto e preenche contexto/assinatura.
- [v] Clique em "Gerar resposta" retorna um texto de resposta coerente,
      no tom do AtivaWriter, em até ~15s pra caso comum.
- [v] Botão "Copiar" copia o texto pro clipboard com confirmação visual.
- [v] Nenhuma imagem ou texto de conversa fica salvo no servidor após a
      resposta.
- [v] Erros de OpenAI (rate limit, imagem ilegível, etc.) aparecem como
      mensagem clara na tela, sem quebrar a página.

## Fora de escopo (v1) — backlog futuro

- Multiusuário / login individual.
- Histórico de gerações (mesmo que só local, no navegador).
- RAG automático (upload de exportação da pasta Sent, por exemplo).
- OCR dedicado separado da chamada de IA (hoje a leitura do print é feita
  pelo próprio modelo multimodal, não por um passo de OCR separado).
- Integração direta com MailHub quando o Mailcow destravar o rollout
  original — nesse ponto, decidir se esta ferramenta é descontinuada ou
  mantida como via alternativa rápida (sem RAG) pra quem prefere.

## Decisões em aberto (usuário)

- Confirmar modelo de visão a usar (custo/qualidade) — `gpt-4.1-mini` já
  usado no MailHub suporta imagem, mas vale validar leitura de print de
  e-mail real antes de fixar. vamos seguir com esse
- Senha compartilhada é suficiente, ou preferível reusar login do MailHub
  (JWT existente) mesmo sendo apps separados?
- Nome definitivo da ferramenta/URL (ex: `writer.ativa.ai`,
  subpasta do domínio atual, etc.). AtivaWriter
- Quem no time vai usar isso primeiro (pra validar fluxo antes de abrir pra
  todos)? SDR REMOTO
