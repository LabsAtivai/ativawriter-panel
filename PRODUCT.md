# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipe interna da Ativa.ai (agência de prospecção B2B) que responde e-mails de
prospecção/cadência manualmente, várias vezes por dia, pelo MailHub/webmail/cPanel.
Primeiro usuário a validar o fluxo: SDR remoto. Uso interno de trabalho, não é
produto client-facing — desktop, não mobile.

## Product Purpose

Gerar um rascunho de resposta de e-mail com IA, no mesmo tom/estilo do AtivaWriter,
a partir de um print de tela ou texto colado manualmente pela pessoa usuária. Ela
copia o rascunho gerado e cola manualmente no MailHub/webmail pra enviar — a
ferramenta não envia e-mail nenhum.

## Positioning

O rollout nativo do AtivaWriter dentro do MailHub depende de indexação (RAG)
automático sobre a pasta Sent via IMAP, hoje bloqueado esperando a migração pra
Mailcow. Esta ferramenta é a ponte enquanto isso: mesma qualidade de resposta,
zero integração — standalone, sem IMAP/SMTP/banco, deploy trivial (1 container).

## Operating Context

Usada lado a lado com o MailHub/webmail em outra aba: a pessoa tira ou copia um
print da conversa de lá, cola aqui (Ctrl+V, drag-and-drop ou upload), opcionalmente
cola texto e contexto adicional, gera a resposta, copia, e volta pro
MailHub/webmail pra enviar manualmente. Uso rápido e repetitivo — múltiplas vezes
ao dia, sessão de trabalho contínua, não uma visita pontual.

## Capabilities and Constraints

- Sem envio de e-mail, sem integração IMAP/SMTP, sem acesso ao banco do MailHub.
- Sem RAG automático — contexto de cliente e respostas anteriores são colados à
  mão pela pessoa usuária, campo a campo.
- Sem banco de dados — stateless. Nenhuma imagem, texto ou resposta gerada fica
  persistida no servidor além da duração da requisição HTTP.
- Autenticação por senha única compartilhada do time (variável de ambiente) — não
  é multiusuário, não tem cadastro nem contas individuais na v1.
- Rate limiting básico no endpoint de geração (controle de custo de OpenAI).
- Sem log de conteúdo de e-mail/print em produção — só metadados (timestamp,
  tamanho, sucesso/erro).
- Geração via OpenAI Responses API (`gpt-4.1-mini`), aceitando texto e/ou imagem
  (print) como entrada multimodal.
- Frontend HTML/CSS/JS vanilla, sem framework nem build step — restrição técnica
  deliberada pra manter deploy trivial (1 container Docker, sem etapa de build).
  Reavaliar só se o escopo crescer bastante.
- Mobile não é prioridade — uso em desktop de trabalho.

## Brand Commitments

Nenhuma identidade visual formal da Ativa.ai precisa ser seguida aqui — confirmado
com o usuário que este painel interno tem liberdade pra ter identidade visual
própria, sem precisar herdar marca/logo/paleta da empresa.

## Evidence on Hand

Nenhum dado real de cliente, e-mail ou depoimento disponível pra usar como
conteúdo de exemplo/mock — qualquer print ou texto de exemplo nas telas deve ser
claramente fictício, nunca apresentado como caso real.

## Product Principles

1. O fluxo colar → gerar → copiar é o caminho crítico; qualquer decisão de design
   deve priorizar velocidade e zero fricção nesse caminho sobre estética decorativa.
2. É ferramenta de trabalho usada muitas vezes por dia — clareza e previsibilidade
   dos estados (vazio, carregando, erro, resultado) importam mais que qualquer
   elemento decorativo.
3. Privacidade por padrão: a interface deve deixar claro que nada fica salvo
   (prints/textos podem conter dados de clientes/leads).
4. Simplicidade de deploy (sem build step, container único) é restrição técnica
   real, não só preferência — o design não deve introduzir dependência de build
   tooling (ex: pré-processador CSS, bundler).

## Accessibility & Inclusion

Nenhum requisito específico além de acessibilidade básica padrão. Tema único
(escuro) confirmado com o usuário — não é necessário suportar tema claro.
