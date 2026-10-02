// Gera os ícones da PWA a partir do ícone oficial (app/icon.png).
// Uso: node scripts/generate-pwa-icons.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "app", "icon.png");
const outDir = path.join(root, "public", "icons");
const background = { r: 255, g: 255, b: 255, alpha: 1 };

await mkdir(outDir, { recursive: true });

// Ícones "any": mesmo desenho do favicon/app icon atual.
for (const size of [192, 512]) {
  await sharp(source)
    .resize(size, size)
    .flatten({ background })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `icon-${size}.png`));
}

// Ícones "maskable": a marca precisa caber na zona segura (círculo de 80% do lado),
// então recortamos o "D" e o centralizamos ocupando ~58% da largura.
const trimmed = await sharp(source)
  .flatten({ background })
  .trim({ background: "#ffffff", threshold: 20 })
  .toBuffer();

for (const size of [192, 512]) {
  const logoWidth = Math.round(size * 0.58);
  const logo = await sharp(trimmed).resize({ width: logoWidth }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: "center" }])
    .flatten({ background })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `maskable-${size}.png`));
}

// Ícone para atalhos do manifest (96x96).
await sharp(source)
  .resize(96, 96)
  .flatten({ background })
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, "shortcut-96.png"));

console.log("Ícones PWA gerados em public/icons");
