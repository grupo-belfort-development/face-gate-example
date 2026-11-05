import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// npm run dev: a tela abre em http://localhost:5173 e /api vai para o Express (porta 3020)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:3020" } },
});
