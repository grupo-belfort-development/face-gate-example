# Face Gate · exemplo Node.js + Express e React (Vite)

```bash
cp .env.example .env   # preencha FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET
npm install
npm run dev            # tela em http://localhost:5173; o /api vai para o Express na 3020
```

Como em produção: `npm run build && npm start` (tela e API em http://localhost:3020).

| Arquivo | Papel |
|---|---|
| `server.js` | Express com as rotas que usam a chave: ticket da câmera, `validate` e `avatar` (o `dotenv` carrega o `.env`) |
| `src/demo.jsx` | a tela: Webcam (com o base64 da captura), Validar foto e Avatar |
| `vite.config.js` | em desenvolvimento, manda o `/api` para o Express |

O `requireLogin` do `server.js` deixa as rotas abertas para o teste: no seu sistema, troque pela sua
autenticação (cada foto consome tokens do plano).

Pré-requisitos (chave, IP liberado, serviços do plano) no [README principal](../README.md).
