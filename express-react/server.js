// Servidor Express de exemplo do SDK @beltec/face-gate: as rotas que usam a chave (o client_secret nunca vai
// para o navegador). A tela React (pasta src, Vite) chama estas rotas.
//   POST /api/face-gate/ticket  -> ticket da webcam para o <FaceGate>
//   POST /api/fotos/validar     -> faceGate.validate (foto enviada, remoção de fundo e melhoria opcionais)
//   POST /api/fotos/avatar      -> faceGate.avatar (por template do portal ou com as opções)
import "dotenv/config";
import express from "express";
import multer from "multer";
import { createFaceGate, FaceGateError } from "@beltec/face-gate/server";

const PORT = Number(process.env.PORT) || 3020;
const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // até 10 MB, em memória

// Cliente do Face Gate criado no primeiro uso: faltando a chave, a rota responde um erro claro.
// Uma instância para o servidor todo: ela guarda e renova o token da chave sozinha.
let faceGate = null;
function client() {
  if (!faceGate) {
    const { FACE_GATE_CLIENT_ID: clientId, FACE_GATE_CLIENT_SECRET: clientSecret } = process.env;
    if (!clientId || !clientSecret) {
      throw new FaceGateError("unauthorized", "Defina FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET no .env", 500);
    }
    faceGate = createFaceGate({ clientId, clientSecret, baseUrl: process.env.FACE_GATE_API_URL || undefined });
  }
  return faceGate;
}

// Em produção, troque pela autenticação do SEU sistema: cada foto consome tokens do plano.
function requireLogin(req, res, next) {
  next();
}

/** Erro do SDK em JSON, com o status da API (401, 402, 403, 429…). */
function sendError(res, e) {
  if (e instanceof FaceGateError) {
    return res.status(e.status >= 400 ? e.status : 502).json({ detail: e.message, code: e.code, resets_at: e.resetsAt });
  }
  console.error(e);
  res.status(500).json({ detail: e?.message ?? "Erro inesperado", code: "server" });
}

const text = (v) => (typeof v === "string" && v !== "" ? v : undefined);
const num = (v) => (text(v) != null ? Number(v) : undefined);

app.post("/api/face-gate/ticket", requireLogin, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store").json(await client().createStreamTicket()); // { ticket, url, expiresIn }
  } catch (e) {
    sendError(res, e);
  }
});

app.post("/api/fotos/validar", requireLogin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ detail: "Envie a foto no campo file" });
    const b = req.body;
    const result = await client().validate(req.file.buffer, {
      filename: req.file.originalname,
      clean: b.clean === "true",
      model: text(b.model),
      device: text(b.device),
      enhance: text(b.enhance) ?? null,
    });
    res.json(result);
  } catch (e) {
    sendError(res, e);
  }
});

app.post(
  "/api/fotos/avatar",
  requireLogin,
  upload.fields([{ name: "file", maxCount: 1 }, { name: "background", maxCount: 1 }]),
  async (req, res) => {
    try {
      const file = req.files?.file?.[0];
      if (!file) return res.status(400).json({ detail: "Envie a foto no campo file" });
      const bg = req.files?.background?.[0];
      const b = req.body;
      const result = await client().avatar(file.buffer, {
        filename: file.originalname,
        template: num(b.template),
        shape: text(b.shape),
        size: num(b.size),
        backgroundColor: text(b.backgroundColor),
        background: bg?.buffer,
        backgroundPosition: bg ? { x: num(b.x), y: num(b.y), zoom: num(b.zoom) } : undefined,
        margin: num(b.margin),
        layout: text(b.layout),
        model: text(b.model),
        device: text(b.device),
      });
      res.json(result);
    } catch (e) {
      sendError(res, e);
    }
  },
);

// npm start (depois do npm run build): a tela compilada sai deste mesmo servidor
app.use(express.static("dist"));

app.listen(PORT, () => console.log(`Face Gate · exemplo (Express) em http://localhost:${PORT}`));
