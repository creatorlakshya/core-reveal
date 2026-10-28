const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Simple PNG encoder
function createPng(width, height, getPixel) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([t, data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(crcBuf), 0);
    return Buffer.concat([len, t, data, crcVal]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = 1 + width * 4;
  const rawData = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a !== undefined ? a : 255;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 6 });
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// 5x7 font definition for uppercase alphanumeric & symbols
const FONT = {
  ' ': [0,0,0,0,0],
  'A': [0x7e, 0x11, 0x11, 0x11, 0x7e],
  'B': [0x7f, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3e, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7f, 0x41, 0x41, 0x22, 0x1c],
  'E': [0x7f, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7f, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3e, 0x41, 0x49, 0x49, 0x7a],
  'H': [0x7f, 0x08, 0x08, 0x08, 0x7f],
  'I': [0x00, 0x41, 0x7f, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3f, 0x01],
  'K': [0x7f, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7f, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  'N': [0x7f, 0x04, 0x08, 0x10, 0x7f],
  'O': [0x3e, 0x41, 0x41, 0x41, 0x3e],
  'P': [0x7f, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3e, 0x41, 0x51, 0x21, 0x5e],
  'R': [0x7f, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7f, 0x01, 0x01],
  'U': [0x3f, 0x40, 0x40, 0x40, 0x3f],
  'V': [0x1f, 0x20, 0x40, 0x20, 0x1f],
  'W': [0x7f, 0x20, 0x18, 0x20, 0x7f],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x60, 0x18, 0x06, 0x01, 0x00],
  '[': [0x7f, 0x41, 0x41, 0x00, 0x00],
  ']': [0x00, 0x00, 0x41, 0x41, 0x7f],
  '(': [0x1c, 0x22, 0x41, 0x00, 0x00],
  ')': [0x00, 0x00, 0x41, 0x22, 0x1c],
};

class CanvasImage {
  constructor(width, height, bg = [0, 0, 0, 255]) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      this.data[i * 4] = bg[0];
      this.data[i * 4 + 1] = bg[1];
      this.data[i * 4 + 2] = bg[2];
      this.data[i * 4 + 3] = bg[3];
    }
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
  }

  drawRect(x, y, w, h, [r, g, b, a]) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  drawStrokeRect(x, y, w, h, thickness, [r, g, b, a]) {
    this.drawRect(x, y, w, thickness, [r, g, b, a]);
    this.drawRect(x, y + h - thickness, w, thickness, [r, g, b, a]);
    this.drawRect(x, y, thickness, h, [r, g, b, a]);
    this.drawRect(x + w - thickness, y, thickness, h, [r, g, b, a]);
  }

  drawChar(ch, startX, startY, scale, color) {
    const glyph = FONT[ch.toUpperCase()] || FONT[' '];
    for (let col = 0; col < 5; col++) {
      const colBits = glyph[col];
      for (let row = 0; row < 7; row++) {
        if ((colBits >> row) & 1) {
          this.drawRect(startX + col * scale, startY + row * scale, scale, scale, color);
        }
      }
    }
  }

  drawText(text, x, y, scale, color) {
    let curX = x;
    for (let i = 0; i < text.length; i++) {
      this.drawChar(text[i], curX, y, scale, color);
      curX += (5 + 1) * scale;
    }
  }

  drawCenteredText(text, y, scale, color) {
    const textWidth = text.length * 6 * scale - scale;
    const x = Math.floor((this.width - textWidth) / 2);
    this.drawText(text, x, y, scale, color);
  }

  toPng() {
    return createPng(this.width, this.height, (x, y) => {
      const idx = (y * this.width + x) * 4;
      return [
        this.data[idx],
        this.data[idx + 1],
        this.data[idx + 2],
        this.data[idx + 3],
      ];
    });
  }
}

// Colors from brand palette
const BURGUNDY = [77, 14, 18, 255];      // #4D0E12
const CREAM = [245, 239, 198, 255];       // #F5EFC6
const CERULEAN = [165, 188, 214, 255];   // #A5BCD6
const DARK_BROWN = [35, 24, 21, 255];    // #231815
const SOIL_BROWN = [74, 46, 39, 255];    // #4A2E27

const CARDS_DIR = path.join(__dirname, '..', 'public', 'assets', 'cards');
const BG_DIR = path.join(__dirname, '..', 'public', 'assets', 'background');

fs.mkdirSync(CARDS_DIR, { recursive: true });
fs.mkdirSync(BG_DIR, { recursive: true });

// 1. Generate Card Back Placeholder (600x900)
console.log('Generating card back placeholder...');
const backImg = new CanvasImage(600, 900, BURGUNDY);
backImg.drawStrokeRect(24, 24, 552, 852, 4, CREAM);
backImg.drawStrokeRect(36, 36, 528, 828, 2, CERULEAN);

backImg.drawStrokeRect(80, 240, 440, 420, 3, CREAM);
backImg.drawStrokeRect(90, 250, 420, 400, 1, CERULEAN);

backImg.drawCenteredText('CARD BACK ARTWORK', 310, 4, CREAM);
backImg.drawCenteredText('REPLACEABLE ASSET', 360, 3, CERULEAN);
backImg.drawCenteredText('ASPECT RATIO 2:3', 440, 3, CREAM);
backImg.drawCenteredText('TARGET RESOLUTION: 800X1200', 480, 2, CERULEAN);
backImg.drawCenteredText('PUBLIC/ASSETS/CARDS/', 530, 2, CREAM);
backImg.drawCenteredText('CARD-BACK-PLACEHOLDER.PNG', 560, 2, CERULEAN);

backImg.drawCenteredText('MSRIT E-CELL', 70, 3, CREAM);
backImg.drawCenteredText('THE SEVEN // TEMPLATE', 810, 2, CERULEAN);

fs.writeFileSync(path.join(CARDS_DIR, 'card-back-placeholder.png'), backImg.toPng());

// 2. Generate Member Front Placeholders (01 to 07)
for (let i = 1; i <= 7; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  console.log(`Generating front placeholder for member ${numStr}...`);
  const frontImg = new CanvasImage(600, 900, CREAM);

  frontImg.drawStrokeRect(24, 24, 552, 852, 4, BURGUNDY);
  frontImg.drawStrokeRect(36, 36, 528, 828, 2, SOIL_BROWN);

  frontImg.drawStrokeRect(80, 180, 440, 480, 3, BURGUNDY);
  frontImg.drawStrokeRect(90, 190, 420, 460, 1, SOIL_BROWN);

  frontImg.drawCenteredText(`MEMBER ${numStr}`, 240, 5, BURGUNDY);
  frontImg.drawCenteredText('CARD FRONT ARTWORK', 310, 3, DARK_BROWN);
  frontImg.drawCenteredText('REPLACEABLE ASSET', 360, 3, SOIL_BROWN);
  frontImg.drawCenteredText('ASPECT RATIO 2:3', 440, 3, BURGUNDY);
  frontImg.drawCenteredText('TARGET RESOLUTION: 800X1200', 480, 2, DARK_BROWN);
  frontImg.drawCenteredText(`MEMBER-${numStr}-FRONT-PLACEHOLDER.PNG`, 540, 2, BURGUNDY);

  frontImg.drawCenteredText(`MEMBER ${numStr} OF 07`, 70, 3, BURGUNDY);
  frontImg.drawCenteredText('INSERT FINAL MEMBER ARTWORK HERE', 790, 2, SOIL_BROWN);
  frontImg.drawCenteredText('MSRIT E-CELL TEMPLATE', 820, 2, BURGUNDY);

  fs.writeFileSync(path.join(CARDS_DIR, `member-${numStr}-front-placeholder.png`), frontImg.toPng());
}

// 3. Generate Background Placeholder (1920x1080)
// Clean presentation backdrop with smooth vignette gradient from center to edge
console.log('Generating background placeholder...');
const bgImg = new CanvasImage(1920, 1080, BURGUNDY);

// Add soft radial shading toward borders
for (let y = 0; y < 1080; y++) {
  const dy = (y - 540) / 540;
  for (let x = 0; x < 1920; x++) {
    const dx = (x - 960) / 960;
    const distSq = dx * dx + dy * dy;
    // Darken outer edges slightly
    if (distSq > 0.4) {
      const factor = Math.min(1, (distSq - 0.4) * 0.7);
      const r = Math.round(77 * (1 - factor * 0.5));
      const g = Math.round(14 * (1 - factor * 0.5));
      const b = Math.round(18 * (1 - factor * 0.5));
      bgImg.setPixel(x, y, r, g, b, 255);
    }
  }
}

// Subtle corner metadata brackets instead of giant center text
bgImg.drawText('STAGE BACKGROUND ARTWORK PLACEHOLDER', 50, 45, 2, [245, 239, 198, 120]);
bgImg.drawText('PUBLIC/ASSETS/BACKGROUND/BACKGROUND-PLACEHOLDER.JPG', 50, 70, 2, [165, 188, 214, 100]);
bgImg.drawText('1920X1080 // 16:9 // REPLACEABLE ASSET', 50, 1025, 2, [245, 239, 198, 90]);

const bgPngBuffer = bgImg.toPng();
fs.writeFileSync(path.join(BG_DIR, 'background-placeholder.jpg'), bgPngBuffer);
fs.writeFileSync(path.join(BG_DIR, 'background-placeholder.png'), bgPngBuffer);

console.log('All placeholder assets generated successfully!');
