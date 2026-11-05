import type { AvatarOptions } from "@beltec/face-gate/server";
import { errorResponse, faceGate, field } from "@/lib/face-gate";

/** Avatar: por template salvo no portal (campo template) ou com as opções enviadas aqui. */
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return Response.json({ detail: "Envie a foto no campo file" }, { status: 400 });
    const num = (name: string) => (field(fd, name) != null ? Number(field(fd, name)) : undefined);
    const bg = fd.get("background");
    const opts: AvatarOptions = {
      filename: file.name,
      template: num("template"),
      shape: field(fd, "shape") as AvatarOptions["shape"],
      size: num("size"),
      backgroundColor: field(fd, "backgroundColor"),
      background: bg instanceof File && bg.size > 0 ? bg : undefined,
      backgroundPosition: bg instanceof File ? { x: num("x"), y: num("y"), zoom: num("zoom") } : undefined,
      margin: num("margin"),
      layout: field(fd, "layout") as AvatarOptions["layout"],
      model: field(fd, "model") as AvatarOptions["model"],
      device: field(fd, "device") as AvatarOptions["device"],
    };
    return Response.json(await faceGate().avatar(file, opts));
  } catch (e) {
    return errorResponse(e);
  }
}
