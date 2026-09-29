const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateOG() {
  const width = 1200;
  const height = 630;

  // Render SVG base
  const svgBanner = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080D1A" />
          <stop offset="60%" stop-color="#0A1124" />
          <stop offset="100%" stop-color="#050811" />
        </linearGradient>
        <radialGradient id="cyanGlow" cx="85%" cy="20%" r="50%">
          <stop offset="0%" stop-color="#007EB3" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#007EB3" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="blueGlow" cx="20%" cy="80%" r="45%">
          <stop offset="0%" stop-color="#3A409D" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#3A409D" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#334155" fill-opacity="0.25" />
        </pattern>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <rect width="${width}" height="${height}" fill="url(#grid)" />
      <rect width="${width}" height="${height}" fill="url(#cyanGlow)" />
      <rect width="${width}" height="${height}" fill="url(#blueGlow)" />
      <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#1E293B" stroke-width="8" />

      <!-- Top Right URL Pill -->
      <g transform="translate(940, 52)">
        <rect width="200" height="42" rx="21" fill="#0F172A" stroke="#007EB3" stroke-width="1.5" stroke-opacity="0.6" />
        <circle cx="22" cy="21" r="5" fill="#10B981" />
        <text x="36" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#E2E8F0">demirdiesel.com.br</text>
      </g>

      <!-- Tagline Pill -->
      <g transform="translate(60, 180)">
        <rect width="360" height="32" rx="8" fill="#007EB3" fill-opacity="0.15" stroke="#007EB3" stroke-width="1" stroke-opacity="0.4" />
        <text x="14" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#38BDF8" letter-spacing="1">CATÁLOGO ONLINE &amp; ATENDIMENTO ESPECIALIZADO</text>
      </g>

      <!-- Main Headline -->
      <text x="60" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
        Módulos Eletrônicos, Injeção &amp; Peças
      </text>
      <text x="60" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#38BDF8" letter-spacing="-1">
        para Caminhões e Linha Pesada
      </text>

      <!-- Subtitle Description -->
      <text x="60" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#94A3B8">
        Especialistas em diagnóstico eletrônico, módulos ECM, bicos injetores e bancadas de alta precisão.
      </text>
      <text x="60" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#94A3B8">
        Catálogo completo com pronta entrega e despacho seguro para todo o Brasil.
      </text>

      <!-- Bottom Feature Badges -->
      <g transform="translate(60, 480)">
        <!-- Card 1 -->
        <g transform="translate(0, 0)">
          <rect width="250" height="80" rx="14" fill="#0F172A" fill-opacity="0.85" stroke="#1E293B" stroke-width="1" />
          <text x="20" y="34" font-size="20">⚙️</text>
          <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#F8FAFC">Estoque Imediato</text>
          <text x="56" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748B">Módulos ECM, bombas e bicos</text>
        </g>

        <!-- Card 2 -->
        <g transform="translate(275, 0)">
          <rect width="250" height="80" rx="14" fill="#0F172A" fill-opacity="0.85" stroke="#1E293B" stroke-width="1" />
          <text x="20" y="34" font-size="20">🔬</text>
          <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#F8FAFC">Laboratório Diesel</text>
          <text x="56" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748B">Testes e reparos eletrônicos</text>
        </g>

        <!-- Card 3 -->
        <g transform="translate(550, 0)">
          <rect width="250" height="80" rx="14" fill="#0F172A" fill-opacity="0.85" stroke="#1E293B" stroke-width="1" />
          <text x="20" y="34" font-size="20">🚚</text>
          <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#F8FAFC">Envio Nacional</text>
          <text x="56" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748B">Despacho ágil e seguro</text>
        </g>

        <!-- Card 4 -->
        <g transform="translate(825, 0)">
          <rect width="250" height="80" rx="14" fill="#0F172A" fill-opacity="0.85" stroke="#1E293B" stroke-width="1" />
          <text x="20" y="34" font-size="20">💬</text>
          <text x="56" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#F8FAFC">Suporte Técnico</text>
          <text x="56" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748B">Mecânicos especialistas</text>
        </g>
      </g>
    </svg>
  `;

  // Overlay the official demir-logo-dark.png at top-left (x: 60, y: 45, height: 75)
  const logoBuf = await sharp('public/images/demir-logo-dark.png')
    .resize({ height: 75 })
    .toBuffer();

  const ogBuffer = await sharp(Buffer.from(svgBanner))
    .composite([{ input: logoBuf, top: 48, left: 60 }])
    .png()
    .toBuffer();

  fs.writeFileSync('public/images/og-presentation.png', ogBuffer);
  fs.writeFileSync('public/og-image.png', ogBuffer);
  console.log('✓ Generated public/images/og-presentation.png and public/og-image.png');
}

generateOG().catch(console.error);
