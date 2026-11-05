import { errorResponse, faceGate, field } from "@/lib/face-gate";

/** Valida uma foto enviada (sem webcam), com remoção de fundo e/ou melhoria opcionais. */
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return Response.json({ detail: "Envie a foto no campo file" }, { status: 400 });
    const result = await faceGate().validate(file, {
      filename: file.name,
      clean: fd.get("clean") === "true",
      model: field(fd, "model") as "u2net" | "u2netp" | "birefnet-portrait" | undefined,
      device: field(fd, "device") as "cpu" | "gpu" | undefined,
      enhance: (field(fd, "enhance") as "classic" | "gfpgan" | undefined) ?? null,
    });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
