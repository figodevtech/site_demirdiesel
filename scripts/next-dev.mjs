import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
  env: {
    ...process.env,
    NODE_USE_SYSTEM_CA: process.env.NODE_USE_SYSTEM_CA || "1",
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Nao foi possivel iniciar o Next.js:", error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
