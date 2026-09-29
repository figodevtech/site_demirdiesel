const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/Leilões PB/.gemini/antigravity-ide/brain/c0e6a761-4d6e-4e83-8a4f-68674b15cfe2/.user_uploaded/media_1790704890013.png';
const publicDir = path.join(__dirname, 'public');
const imagesDir = path.join(publicDir, 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function buildAssets() {
  console.log('--- Generating Brand Assets for Demir Diesel ---');

  // 1. Load original image
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // 2. Exact background de-matting against white
  const lightBuffer = Buffer.alloc(data.length);
  const darkBuffer = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const origA = data[i + 3] / 255;

    if (origA <= 0.02) {
      continue;
    }

    const deltaR = 255 - r;
    const deltaG = 255 - g;
    const deltaB = 255 - b;
    const maxDelta = Math.max(deltaR, deltaG, deltaB);

    if (maxDelta < 8) {
      continue;
    }

    let alphaEst = 0;
    // Check if red text:
    const isRed = deltaG > 30 && deltaB > 30 && deltaR < Math.min(deltaG, deltaB) * 0.55;
    // Check if cyan D:
    const isCyan = deltaR > deltaB && g > r && b > 80;

    if (isRed) {
      alphaEst = Math.max(deltaG / 222, deltaB / 222);
    } else if (isCyan) {
      alphaEst = deltaR / 255;
    } else {
      // Blue / Indigo text:
      alphaEst = Math.max(deltaR / 197, deltaG / 191);
    }

    alphaEst = Math.min(1, Math.max(0, alphaEst));
    const finalAlpha = Math.min(origA, alphaEst);

    if (finalAlpha <= 0.03) {
      continue;
    }

    const invAlpha = 1 - finalAlpha;
    const rf = Math.min(255, Math.max(0, Math.round((r - 255 * invAlpha) / finalAlpha)));
    const gf = Math.min(255, Math.max(0, Math.round((g - 255 * invAlpha) / finalAlpha)));
    const bf = Math.min(255, Math.max(0, Math.round((b - 255 * invAlpha) / finalAlpha)));
    const aByte = Math.round(finalAlpha * 255);

    // Light version (original brand colors)
    lightBuffer[i] = rf;
    lightBuffer[i + 1] = gf;
    lightBuffer[i + 2] = bf;
    lightBuffer[i + 3] = aByte;

    // Dark version (white text for 'emir' and light silver for 'POTÊNCIA COMPUTADORIZADO')
    darkBuffer[i + 3] = aByte;
    if (isCyan) {
      // Keep vibrant cyan
      darkBuffer[i] = rf;
      darkBuffer[i + 1] = gf;
      darkBuffer[i + 2] = bf;
    } else if (isRed) {
      // Keep vibrant red
      darkBuffer[i] = rf;
      darkBuffer[i + 1] = gf;
      darkBuffer[i + 2] = bf;
    } else {
      // Blue text turned into bright white for dark background
      darkBuffer[i] = 255;
      darkBuffer[i + 1] = 255;
      darkBuffer[i + 2] = 255;
    }
  }

  // Save trimmed demir-logo.png (for light backgrounds)
  const logoLightPath = path.join(imagesDir, 'demir-logo.png');
  await sharp(lightBuffer, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(logoLightPath);
  console.log('✓ Created:', logoLightPath);

  // Save trimmed demir-logo-dark.png (for dark backgrounds)
  const logoDarkPath = path.join(imagesDir, 'demir-logo-dark.png');
  await sharp(darkBuffer, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(logoDarkPath);
  console.log('✓ Created:', logoDarkPath);

  // 3. Extract clean isolated "D" symbol
  // Find strict cyan bounds
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = lightBuffer[idx];
      const g = lightBuffer[idx + 1];
      const b = lightBuffer[idx + 2];
      const a = lightBuffer[idx + 3];

      if (a > 20 && g > 75 && (g - r > 30) && b > 100) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const dWidth = maxX - minX + 1;
  const dHeight = maxY - minY + 1;
  const dBuffer = Buffer.alloc(dWidth * dHeight * 4);

  for (let y = 0; y < dHeight; y++) {
    for (let x = 0; x < dWidth; x++) {
      const srcIdx = ((y + minY) * w + (x + minX)) * 4;
      const destIdx = (y * dWidth + x) * 4;
      const r = lightBuffer[srcIdx];
      const g = lightBuffer[srcIdx + 1];
      const b = lightBuffer[srcIdx + 2];
      const a = lightBuffer[srcIdx + 3];

      if (a > 10 && g > 60 && (g - r > 20) && b > 80) {
        dBuffer[destIdx] = r;
        dBuffer[destIdx + 1] = g;
        dBuffer[destIdx + 2] = b;
        dBuffer[destIdx + 3] = a;
      }
    }
  }

  const dCleanTrimmed = await sharp(dBuffer, { raw: { width: dWidth, height: dHeight, channels: 4 } })
    .trim()
    .png()
    .toBuffer();

  // Save isolated D icon (512x512 transparent with comfortable padding)
  const dSquareSize = 512;
  const dInnerSize = 440; // padding of 36px
  const resizedD = await sharp(dCleanTrimmed)
    .resize(dInnerSize, dInnerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const dIconPath = path.join(imagesDir, 'demir-d-icon.png');
  await sharp({
    create: { width: dSquareSize, height: dSquareSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: resizedD, gravity: 'center' }])
    .png()
    .toFile(dIconPath);
  console.log('✓ Created:', dIconPath);

  // Copy to public/icon.png (standard web icon)
  const publicIconPath = path.join(publicDir, 'icon.png');
  fs.copyFileSync(dIconPath, publicIconPath);
  console.log('✓ Updated:', publicIconPath);

  // 4. Generate Apple Touch Icon (180x180 with sleek dark squircle background)
  const appleSvg = Buffer.from(`
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0A0F1D" />
        </linearGradient>
        <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#0284C7" stop-opacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="170" height="170" rx="40" fill="url(#bg)" stroke="url(#border)" stroke-width="4" />
    </svg>
  `);

  const dForApple = await sharp(dCleanTrimmed)
    .resize(126, 126, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const appleIconPath = path.join(publicDir, 'apple-icon.png');
  await sharp(appleSvg)
    .composite([{ input: dForApple, gravity: 'center' }])
    .png()
    .toFile(appleIconPath);
  console.log('✓ Updated:', appleIconPath);

  // 5. Generate Multi-Resolution favicon.ico (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(dCleanTrimmed)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  const count = pngBuffers.length;
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(count, 4);

  const dirEntries = [];
  let currentOffset = 6 + count * 16;

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    currentOffset += item.buffer.length;
  }

  const faviconPath = path.join(publicDir, 'favicon.ico');
  const icoBuffer = Buffer.concat([icoHeader, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
  fs.writeFileSync(faviconPath, icoBuffer);
  console.log('✓ Updated:', faviconPath);

  // 6. Generate SVG version of the D mark
  // Copy d_vector_smooth.svg or create clean svg
  if (fs.existsSync('d_vector_smooth.svg')) {
    const svgDest = path.join(imagesDir, 'demir-d-icon.svg');
    fs.copyFileSync('d_vector_smooth.svg', svgDest);
    console.log('✓ Created:', svgDest);
  }

  console.log('--- Brand Assets Generation Complete! ---');
}

buildAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
