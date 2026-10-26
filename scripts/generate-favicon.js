const fs = require('fs');
const path = require('path');

const width = 32;
const height = 32;
const pixels = new Uint8Array(width * height * 4); // RGBA

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[idx] = Math.round((r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA);
    pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
    pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
    pixels[idx + 3] = Math.round(outA * 255);
  }
}

// 1. Draw rounded squircle background (#0d0e12) with subtle outline (#2a2d36)
const radius = 7.5;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    let dx = 0;
    let dy = 0;
    if (x < radius) dx = radius - x;
    else if (x > width - 1 - radius) dx = x - (width - 1 - radius);

    if (y < radius) dy = radius - y;
    else if (y > height - 1 - radius) dy = y - (height - 1 - radius);

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      let alpha = 1.0;
      if (dist > radius - 1) {
        alpha = radius - dist;
      }
      if (dist > radius - 1.5 || x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        setPixel(x, y, 42, 45, 54, Math.round(alpha * 255));
      } else {
        setPixel(x, y, 13, 14, 18, Math.round(alpha * 255));
      }
    }
  }
}

function fillEllipse(cx, cy, rx, ry, r, g, b) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const normX = (x - cx) / rx;
      const normY = (y - cy) / ry;
      const dist = Math.sqrt(normX * normX + normY * normY);
      if (dist <= 1.0) {
        let a = 1.0;
        if (dist > 0.8) a = (1.0 - dist) / 0.2;
        setPixel(x, y, r, g, b, Math.round(a * 255));
      }
    }
  }
}

// Body parts
fillEllipse(15.5, 11.2, 1.8, 1.8, 255, 255, 255); // Head
fillEllipse(15.5, 14.6, 2.2, 2.2, 255, 255, 255); // Thorax
fillEllipse(15.5, 19.8, 3.4, 4.3, 255, 255, 255); // Abdomen

function drawQuadraticBezier(x0, y0, cx, cy, x1, y1, width, r, g, b) {
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const px = inv * inv * x0 + 2 * inv * t * cx + t * t * x1;
    const py = inv * inv * y0 + 2 * inv * t * cy + t * t * y1;
    fillEllipse(px, py, width / 2, width / 2, r, g, b);
  }
}

// Exact 4-Up, 4-Down Arched Legs
const legWidth = 1.35;
// Top Left
drawQuadraticBezier(14.0, 13.4, 11.8, 8.5, 14.1, 4.5, legWidth, 255, 255, 255);
drawQuadraticBezier(13.5, 14.4, 8.5, 10.0, 9.9, 5.8, legWidth, 255, 255, 255);

// Bottom Left
drawQuadraticBezier(13.5, 15.7, 8.5, 20.0, 9.9, 25.6, legWidth, 255, 255, 255);
drawQuadraticBezier(14.0, 17.3, 11.5, 22.0, 14.1, 27.5, legWidth, 255, 255, 255);

// Top Right
drawQuadraticBezier(17.0, 13.4, 19.2, 8.5, 16.9, 4.5, legWidth, 255, 255, 255);
drawQuadraticBezier(17.5, 14.4, 22.5, 10.0, 21.1, 5.8, legWidth, 255, 255, 255);

// Bottom Right
drawQuadraticBezier(17.5, 15.7, 22.5, 20.0, 21.1, 25.6, legWidth, 255, 255, 255);
drawQuadraticBezier(17.0, 17.3, 19.5, 22.0, 16.9, 27.5, legWidth, 255, 255, 255);

// ICO binary assembly
const headerSize = 6;
const dirEntrySize = 16;
const bmiHeaderSize = 40;
const colorDataSize = width * height * 4;
const andMaskSize = (width * height) / 8;
const imageSize = bmiHeaderSize + colorDataSize + andMaskSize;
const totalFileSize = headerSize + dirEntrySize + imageSize;

const buf = Buffer.alloc(totalFileSize);
buf.writeUInt16LE(0, 0);
buf.writeUInt16LE(1, 2);
buf.writeUInt16LE(1, 4);

buf.writeUInt8(width, 6);
buf.writeUInt8(height, 7);
buf.writeUInt8(0, 8);
buf.writeUInt8(0, 9);
buf.writeUInt16LE(1, 10);
buf.writeUInt16LE(32, 12);
buf.writeUInt32LE(imageSize, 14);
buf.writeUInt32LE(headerSize + dirEntrySize, 18);

let offset = 22;
buf.writeUInt32LE(40, offset);
buf.writeInt32LE(width, offset + 4);
buf.writeInt32LE(height * 2, offset + 8);
buf.writeUInt16LE(1, offset + 12);
buf.writeUInt16LE(32, offset + 14);
buf.writeUInt32LE(0, offset + 16);
buf.writeUInt32LE(colorDataSize, offset + 20);
buf.writeInt32LE(0, offset + 24);
buf.writeInt32LE(0, offset + 28);
buf.writeUInt32LE(0, offset + 32);
buf.writeUInt32LE(0, offset + 36);
offset += 40;

for (let y = height - 1; y >= 0; y--) {
  for (let x = 0; x < width; x++) {
    const srcIdx = (y * width + x) * 4;
    buf.writeUInt8(pixels[srcIdx + 2], offset++);
    buf.writeUInt8(pixels[srcIdx + 1], offset++);
    buf.writeUInt8(pixels[srcIdx], offset++);
    buf.writeUInt8(pixels[srcIdx + 3], offset++);
  }
}

buf.fill(0, offset, offset + andMaskSize);

const outputPath = path.join(__dirname, '..', 'public', 'favicon.ico');
fs.writeFileSync(outputPath, buf);
console.log('Regenerated public/favicon.ico with exact spider layout (' + totalFileSize + ' bytes)');
