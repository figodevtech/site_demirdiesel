const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcIconPath = path.join(rootDir, 'public', 'images', 'demir-d-icon.png');

async function updateAllFavicons() {
  console.log('Generating official Demir D favicon.ico and app icons...');

  const dRaw = await sharp(srcIconPath).trim().toBuffer();

  // Create frames for 16, 32, 48, 64
  const sizes = [16, 32, 48, 64];
  const pngFrames = [];

  for (const size of sizes) {
    // Add 1px padding for 16/32 so it doesn't touch the edge
    const pad = size <= 16 ? 0 : (size <= 32 ? 1 : 2);
    const innerSize = size - pad * 2;

    const resized = await sharp(dRaw)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3
      })
      .png()
      .toBuffer();

    const frame = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resized, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    pngFrames.push({ size, buffer: frame });
  }

  // Build standard multi-resolution ICO file
  const count = pngFrames.length;
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO
  icoHeader.writeUInt16LE(count, 4);

  const dirEntries = [];
  let currentOffset = 6 + count * 16;

  for (const item of pngFrames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += item.buffer.length;
  }

  const finalIcoBuffer = Buffer.concat([
    icoHeader,
    ...dirEntries,
    ...pngFrames.map(f => f.buffer)
  ]);

  // Write to both app/favicon.ico and public/favicon.ico
  const appFavicon = path.join(rootDir, 'app', 'favicon.ico');
  const pubFavicon = path.join(rootDir, 'public', 'favicon.ico');
  fs.writeFileSync(appFavicon, finalIcoBuffer);
  fs.writeFileSync(pubFavicon, finalIcoBuffer);
  console.log('✓ Updated:', appFavicon);
  console.log('✓ Updated:', pubFavicon);

  // Update app/icon.png and public/icon.png (512x512)
  const appIcon = path.join(rootDir, 'app', 'icon.png');
  const pubIcon = path.join(rootDir, 'public', 'icon.png');
  const icon512 = await sharp(dRaw)
    .resize(440, 440, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const finalIcon512 = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: icon512, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(appIcon, finalIcon512);
  fs.writeFileSync(pubIcon, finalIcon512);
  console.log('✓ Updated:', appIcon);
  console.log('✓ Updated:', pubIcon);

  // Update app/apple-icon.png and public/apple-icon.png
  const appApple = path.join(rootDir, 'app', 'apple-icon.png');
  const pubApple = path.join(rootDir, 'public', 'apple-icon.png');
  if (fs.existsSync(pubApple)) {
    fs.copyFileSync(pubApple, appApple);
    console.log('✓ Synced:', appApple);
  }

  console.log('Favicon update completed successfully!');
}

updateAllFavicons().catch(err => {
  console.error('Error updating favicons:', err);
  process.exit(1);
});
