# Face Gate · exemplo Next.js (App Router)

```bash
cp .env.example .env.local   # preencha FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET
npm install
npm run dev                  # http://localhost:3010
```

| Arquivo | Papel |
|---|---|
| `lib/face-gate.ts` | cliente do SDK, só no servidor (`server-only`), criado no primeiro uso |
| `app/api/face-gate/ticket/route.ts` | ticket da câmera para o `<FaceGate>` (troque o `authorize` pela sua sessão) |
| `app/api/fotos/validar/route.ts` | `faceGate().validate` com remoção de fundo e melhoria opcionais |
| `app/api/fotos/avatar/route.ts` | `faceGate().avatar` por template ou com as opções |
| `app/demo.jsx` | a tela: Webcam (com o base64 da captura), Validar foto e Avatar |

Pré-requisitos (chave, IP liberado, serviços do plano) no [README principal](../README.md).
