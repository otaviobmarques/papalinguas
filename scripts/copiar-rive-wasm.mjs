// Copia o motor do Rive (WebAssembly) para public/, para o app não depender de CDN externo
// e a mesma versão do pacote instalado ser sempre a servida.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
const origem = "node_modules/@rive-app/canvas/rive.wasm";
if (existsSync(origem)) {
  mkdirSync("public/rive", { recursive: true });
  copyFileSync(origem, "public/rive/rive.wasm");
}
