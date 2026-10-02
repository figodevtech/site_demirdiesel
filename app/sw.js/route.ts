import { readFile } from "node:fs/promises";
import path from "node:path";
import { APP_VERSION } from "@/lib/pwa/config";

// Gerado no build: o conteúdo só muda quando a versão do deploy muda,
// o que dispara a atualização do Service Worker nos aparelhos.
export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "lib", "pwa", "service-worker.js"), "utf8");
  const version = APP_VERSION.replace(/[^\w.-]/g, "");
  const body = source.replaceAll("__APP_VERSION__", version);

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
