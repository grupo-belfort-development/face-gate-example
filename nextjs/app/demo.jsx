"use client";

// Tela de exemplo do SDK @beltec/face-gate: as três funções num lugar só.
//   Webcam  -> <FaceGate> (o ticket vem da rota /api/face-gate/ticket do seu servidor)
//   Foto    -> POST /api/fotos/validar (o servidor chama faceGate.validate)
//   Avatar  -> POST /api/fotos/avatar  (o servidor chama faceGate.avatar)
// O client_secret nunca vem para o navegador: só as rotas do servidor usam a chave.
import { useState } from "react";
import { FaceGate } from "@beltec/face-gate";
import "@beltec/face-gate/styles.css";

const TABS = [
  ["webcam", "Webcam"],
  ["foto", "Validar foto"],
  ["avatar", "Avatar"],
];

export default function Demo() {
  const [tab, setTab] = useState("webcam");
  return (
    <main className="wrap">
      <header>
        <h1>Face Gate · exemplo de integração</h1>
        <p className="muted">
          Pacote <code>@beltec/face-gate</code>. Cada função consome tokens do plano da chave configurada no
          servidor.
        </p>
      </header>
      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "webcam" && <WebcamTab />}
      {tab === "foto" && <PhotoTab />}
      {tab === "avatar" && <AvatarTab />}
    </main>
  );
}

/* ------------------------------------------------------------------ webcam */

function WebcamTab() {
  const [o, setO] = useState({ clean: false, model: "", device: "", enhance: "", autoFrame: true, mirror: true });
  const [capture, setCapture] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setO({ ...o, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <section className="grid">
      <div className="card">
        <h2>Opções</h2>
        <label className="check">
          <input type="checkbox" checked={o.clean} onChange={set("clean")} /> Remover o fundo (serviço "validar e remover
          fundo")
        </label>
        <Select label="Modelo de remoção de fundo" value={o.model} onChange={set("model")} options={MODELS} />
        <Select label="Melhorar a foto capturada" value={o.enhance} onChange={set("enhance")} options={ENHANCE} />
        <Select label="Processar em" value={o.device} onChange={set("device")} options={DEVICES} />
        <label className="check">
          <input type="checkbox" checked={o.autoFrame} onChange={set("autoFrame")} /> Enquadramento automático
        </label>
        <label className="check">
          <input type="checkbox" checked={o.mirror} onChange={set("mirror")} /> Prévia espelhada
        </label>
        <p className="muted">A câmera exige HTTPS ou localhost.</p>
      </div>
      <div className="card">
        <FaceGate
          getTicket={async () => {
            const r = await fetch("/api/face-gate/ticket", { method: "POST" });
            const body = await r.json();
            if (!r.ok) throw new Error(body.detail || "Não foi possível abrir a câmera");
            return body; // { ticket, url }
          }}
          clean={o.clean}
          model={o.model || undefined}
          device={o.device || undefined}
          enhance={o.enhance || null}
          autoFrame={o.autoFrame}
          mirror={o.mirror}
          onCapture={async (c) => {
            setError(null);
            setCapture({ ...c, b64: await captureBase64(c) });
          }}
          onError={(e) => setError(`${e.code}: ${e.message}`)}
        />
        {error && <p className="error">{error}</p>}
      </div>
      {capture && (
        <div className="card wide">
          <h2>Captura</h2>
          <Result result={capture.result} images={[["Foto final", capture.image]]} />
          <Base64Box b64={capture.b64} />
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- validar foto */

function PhotoTab() {
  const [file, setFile] = useState(null);
  const [o, setO] = useState({ clean: false, model: "", device: "", enhance: "" });
  const { busy, result, error, send } = useSend("/api/fotos/validar");
  const set = (k) => (e) => setO({ ...o, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", file);
    for (const [k, v] of Object.entries(o)) if (v !== "" && v !== false) fd.append(k, String(v));
    send(fd);
  }

  return (
    <section className="grid">
      <form className="card" onSubmit={submit}>
        <h2>Foto</h2>
        <FileInput label="Foto (JPG, PNG ou WebP, até 10 MB)" onFile={setFile} />
        <label className="check">
          <input type="checkbox" checked={o.clean} onChange={set("clean")} /> Remover o fundo se aprovada
        </label>
        <Select label="Modelo de remoção de fundo" value={o.model} onChange={set("model")} options={MODELS} />
        <Select label="Melhorar antes de validar" value={o.enhance} onChange={set("enhance")} options={ENHANCE} />
        <Select label="Processar em" value={o.device} onChange={set("device")} options={DEVICES} />
        <button className="primary" disabled={!file || busy}>
          {busy ? "Validando…" : "Validar"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <div className="card">
        <h2>Resultado</h2>
        {result ? (
          <Result
            result={result}
            images={[
              ["Sem fundo", result.cleaned_image],
              ["Melhorada", result.enhancement?.enhanced_image],
            ]}
          />
        ) : (
          <p className="muted">Escolha uma foto e clique em Validar.</p>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- avatar */

function AvatarTab() {
  const [file, setFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [o, setO] = useState({
    mode: "template", template: "", shape: "round", size: "512", background: "transparent",
    backgroundColor: "#1d252a", x: "50", y: "50", zoom: "100", margin: "20", layout: "center", model: "", device: "",
  });
  const { busy, result, error, send } = useSend("/api/fotos/avatar");
  const set = (k) => (e) => setO({ ...o, [k]: e.target.value });
  const manual = o.mode === "manual";
  const hasBg = manual && o.background !== "transparent";

  function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", file);
    if (o.model) fd.append("model", o.model);
    if (o.device) fd.append("device", o.device);
    if (!manual) fd.append("template", o.template);
    else {
      fd.append("shape", o.shape);
      fd.append("size", o.size);
      if (o.background === "color") fd.append("backgroundColor", o.backgroundColor);
      if (o.background === "image" && bgFile) {
        fd.append("background", bgFile);
        fd.append("x", o.x);
        fd.append("y", o.y);
        fd.append("zoom", o.zoom);
      }
      if (hasBg) {
        fd.append("margin", o.margin);
        fd.append("layout", o.layout);
      }
    }
    send(fd);
  }

  return (
    <section className="grid">
      <form className="card" onSubmit={submit}>
        <h2>Avatar</h2>
        <FileInput label="Foto da pessoa" onFile={setFile} />
        <Select label="Como montar" value={o.mode} onChange={set("mode")}
          options={[["template", "Template salvo no portal (recomendado)"], ["manual", "Opções aqui"]]} />
        {!manual ? (
          <label>
            Id do template (portal → Avatares)
            <input type="number" min="1" value={o.template} onChange={set("template")} required />
          </label>
        ) : (
          <>
            <Select label="Formato" value={o.shape} onChange={set("shape")} options={[["round", "Redondo"], ["square", "Quadrado"]]} />
            <label>
              Tamanho (64 a 1024 px)
              <input type="number" min="64" max="1024" value={o.size} onChange={set("size")} />
            </label>
            <Select label="Fundo" value={o.background} onChange={set("background")}
              options={[["transparent", "Transparente"], ["color", "Cor"], ["image", "Imagem"]]} />
            {o.background === "color" && (
              <label>
                Cor <input type="color" value={o.backgroundColor} onChange={set("backgroundColor")} />
              </label>
            )}
            {o.background === "image" && (
              <>
                <FileInput label="Imagem de fundo" onFile={setBgFile} />
                <div className="row">
                  <label>X % <input type="number" min="0" max="100" value={o.x} onChange={set("x")} /></label>
                  <label>Y % <input type="number" min="0" max="100" value={o.y} onChange={set("y")} /></label>
                  <label>Zoom % <input type="number" min="100" max="300" value={o.zoom} onChange={set("zoom")} /></label>
                </div>
              </>
            )}
            {hasBg && (
              <>
                <label>
                  Margem para o fundo (0 a 60 %)
                  <input type="number" min="0" max="60" value={o.margin} onChange={set("margin")} />
                </label>
                <Select label="Posição da pessoa" value={o.layout} onChange={set("layout")}
                  options={[["center", "Centro"], ["bottom", "Na base"], ["left", "Base à esquerda"], ["right", "Base à direita"]]} />
              </>
            )}
          </>
        )}
        <Select label="Modelo do recorte" value={o.model} onChange={set("model")} options={MODELS} />
        <Select label="Processar em" value={o.device} onChange={set("device")} options={DEVICES} />
        <button className="primary" disabled={!file || busy}>
          {busy ? "Gerando…" : "Gerar avatar"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <div className="card">
        <h2>Resultado</h2>
        {result ? (
          <Result result={result} images={[["Avatar", result.avatar_image]]} checker />
        ) : (
          <p className="muted">Sem avatar ainda. Foto reprovada não gera avatar.</p>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- utilidades */

const MODELS = [["", "Padrão do servidor"], ["u2net", "u2net"], ["u2netp", "u2netp (rápido)"], ["birefnet-portrait", "BiRefNet (alta qualidade)"]];
const ENHANCE = [["", "Não melhorar"], ["classic", "Clássica (luz, cor, nitidez)"], ["gfpgan", "Com IA (GFPGAN)"]];
const DEVICES = [["", "Padrão do servidor"], ["cpu", "CPU"], ["gpu", "GPU"]];

function useSend(url) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  async function send(fd) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(url, { method: "POST", body: fd });
      const body = await r.json().catch(() => ({ detail: `Erro ${r.status}` }));
      if (!r.ok) throw new Error(`${body.code ? body.code + ": " : ""}${body.detail || `Erro ${r.status}`}`);
      setResult(body);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, result, error, send };
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={onChange}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function FileInput({ label, onFile }) {
  return (
    <label>
      {label}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function Result({ result, images, checker }) {
  const shown = images.filter(([, src]) => src);
  return (
    <div className="result">
      <p className={result.accepted ? "ok" : "error"}>
        {result.accepted ? "Aprovada" : "Reprovada"}
        {typeof result.score === "number" && ` · qualidade ${Math.round(result.score * 100)}%`}
        {result.usage?.tokens != null && ` · ${result.usage.tokens} tokens`}
      </p>
      {!result.accepted && result.hard_fails?.length > 0 && <p className="muted">Motivos: {result.hard_fails.join(", ")}</p>}
      {result.warnings?.length > 0 && <p className="muted">Avisos: {result.warnings.join(", ")}</p>}
      {shown.map(([label, src]) => (
        <figure key={label}>
          <img src={src} alt={label} className={checker ? "checker" : ""} />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
      <details>
        <summary>JSON completo</summary>
        <pre>{JSON.stringify(strip(result), null, 2)}</pre>
      </details>
    </div>
  );
}

/**
 * Base64 da foto capturada pela webcam (sem o prefixo "data:...;base64,") e o tipo da imagem.
 * Com remoção de fundo ou melhoria, `image` já vem como data URL; sem elas, é um blob URL do navegador e o
 * base64 sai do `frame` (o JPEG validado).
 */
async function captureBase64(c) {
  const dataUrl = c.image.startsWith("data:")
    ? c.image
    : await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(c.frame);
      });
  const [head, base64] = dataUrl.split(",");
  return { base64, mime: head.slice(5, head.indexOf(";")) };
}

function Base64Box({ b64 }) {
  const [copied, setCopied] = useState(false);
  if (!b64) return null;
  return (
    <div className="b64">
      <p className="muted">
        Base64 ({b64.mime}, {b64.base64.length.toLocaleString("pt-BR")} caracteres): é o que você envia ao seu
        backend para gravar no cadastro.
      </p>
      <textarea readOnly rows={3} value={b64.base64} />
      <button
        type="button"
        className="primary"
        onClick={async () => {
          await navigator.clipboard.writeText(b64.base64);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copiado" : "Copiar base64"}
      </button>
    </div>
  );
}

/** Tira as imagens em base64 do JSON exibido (ficam enormes). */
function strip(r) {
  const cut = (v) => (typeof v === "string" && v.startsWith("data:") ? "(imagem omitida)" : v);
  return {
    ...r,
    cleaned_image: cut(r.cleaned_image),
    avatar_image: cut(r.avatar_image),
    enhancement: r.enhancement ? { ...r.enhancement, enhanced_image: cut(r.enhancement.enhanced_image) } : undefined,
  };
}
