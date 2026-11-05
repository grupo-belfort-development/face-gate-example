# Face Gate · exemplos de integração

Projetos prontos para testar o **Face Gate** (BelTec) com o SDK [`@beltec/face-gate`](https://www.npmjs.com/package/@beltec/face-gate):
clone, coloque a sua chave e rode. Cada exemplo tem uma página com **todas as funções**:

| Aba | O que faz | No servidor |
|---|---|---|
| **Webcam** | câmera com validação ao vivo, enquadramento automático e captura sozinha quando a foto passa em todos os critérios; opções de remover o fundo, melhorar a foto (clássica ou com IA), modelo, CPU/GPU e espelho; mostra a foto em **base64** para enviar ao seu backend | rota que emite o ticket da câmera |
| **Validar foto** | envio de um arquivo, com remoção de fundo e/ou melhoria | `faceGate.validate` |
| **Avatar** | por **template** salvo no portal (id) ou com as opções: formato, tamanho, fundo transparente, cor ou imagem (com posição e zoom), margem e posição da pessoa | `faceGate.avatar` |

| Exemplo | Pasta |
|---|---|
| **Next.js** (App Router): tela e servidor no mesmo projeto | [`nextjs/`](nextjs) |
| **Node.js + Express** (servidor) e **React** com Vite (tela) | [`express-react/`](express-react) |

O `client_secret` fica só no servidor: o navegador recebe apenas um ticket de uso único (60 s) para a câmera.

## Antes de começar (portal do Face Gate)

1. **Chave de acesso** (Chaves de acesso): copie o `client_id` e o `client_secret` (o secret aparece uma vez só).
2. **IP liberado**: inclua na chave o **IP público da máquina** onde o exemplo vai rodar (é o servidor do
   exemplo que chama a API). Fora da lista, a resposta é `forbidden`.
3. **Serviços do plano**: remover fundo, melhoria e avatar só funcionam se estiverem contratados. Cada foto
   validada consome tokens do plano (os quadros ao vivo da webcam, não).
4. **Avatar por template**: crie o template em **Avatares** e use o id dele.

Requisitos: Node.js 18.17 ou mais novo e um navegador com câmera. A câmera só abre em `localhost` ou HTTPS.

## Next.js

```bash
cd nextjs
cp .env.example .env.local   # preencha FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET
npm install
npm run dev                  # http://localhost:3010
```

## Express + React

```bash
cd express-react
cp .env.example .env         # preencha FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET
npm install
npm run dev                  # http://localhost:5173 (o /api vai para o Express na porta 3020)
```

Como em produção: `npm run build && npm start` (tela e API em http://localhost:3020).

## Erros comuns

| Mensagem | Causa |
|---|---|
| `Defina FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET` | `.env` / `.env.local` sem a chave (reinicie depois de preencher) |
| `unauthorized: Chave ou secret inválido` | `client_id` ou `client_secret` errados |
| `forbidden` | IP da máquina fora da lista da chave, serviço não contratado ou chave bloqueada |
| `token_window_limit` / `token_month_limit` | cota de tokens do plano |
| "A câmera exige HTTPS ou localhost" | abra por `localhost` (ou publique com HTTPS) |

## Documentação

- SDK: [README do `@beltec/face-gate`](https://www.npmjs.com/package/@beltec/face-gate)
- Portal do Face Gate: **Instalação** (passo a passo) e **Integração** (API HTTP)
