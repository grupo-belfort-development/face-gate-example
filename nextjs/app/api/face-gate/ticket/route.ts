import { errorResponse, faceGate } from "@/lib/face-gate";

/**
 * Ticket da webcam: o <FaceGate> chama esta rota e recebe { ticket, url } (uso único, 60 s).
 * Em produção, só usuários logados no SEU sistema devem abrir a câmera (cada captura consome tokens):
 *   faceGate().ticketHandler({ authorize: async (req) => Boolean(await suaSessao(req)) })(req)
 */
export async function POST(req: Request) {
  try {
    return await faceGate().ticketHandler({ authorize: async () => true })(req);
  } catch (e) {
    return errorResponse(e);
  }
}
