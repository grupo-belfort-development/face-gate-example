import "server-only"; // npm install server-only: impede que este módulo (com a chave) vá para o navegador
import { createFaceGate, FaceGateError, type FaceGateServer } from "@beltec/face-gate/server";

let instance: FaceGateServer | null = null;

/**
 * Cliente do Face Gate (só no servidor). Criado no primeiro uso, não ao carregar o módulo: assim o `next build`
 * funciona mesmo sem as variáveis, e faltando a chave a rota responde um erro claro em vez de derrubar o app.
 * Uma instância para o servidor todo: ela guarda e renova o token da chave sozinha.
 */
export function faceGate(): FaceGateServer {
  if (!instance) {
    const clientId = process.env.FACE_GATE_CLIENT_ID;
    const clientSecret = process.env.FACE_GATE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new FaceGateError("unauthorized", "Defina FACE_GATE_CLIENT_ID e FACE_GATE_CLIENT_SECRET no .env.local", 500);
    }
    instance = createFaceGate({ clientId, clientSecret, baseUrl: process.env.FACE_GATE_API_URL || undefined });
  }
  return instance;
}

/** Erro do SDK (FaceGateError) em JSON, com o status da API (401, 402, 403, 429…). */
export function errorResponse(e: unknown): Response {
  if (e instanceof FaceGateError) {
    return Response.json(
      { detail: e.message, code: e.code, resets_at: e.resetsAt },
      { status: e.status && e.status >= 400 ? e.status : 502 },
    );
  }
  console.error(e);
  return Response.json({ detail: (e as Error)?.message ?? "Erro inesperado", code: "server" }, { status: 500 });
}

/** Campo de texto do formulário (vazio = não enviado). */
export const field = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" && v !== "" ? v : undefined;
};
