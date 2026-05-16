/**
 * Generates all static icon/OG PNG files and favicon.ico into /public.
 * Run: node scripts/generate-icons.js
 *
 * Uses sharp (already installed). No extra deps.
 */

const sharp = require("sharp");
const path  = require("path");
const fs    = require("fs");

const OUT = path.join(__dirname, "..", "public");
fs.mkdirSync(OUT, { recursive: true });

const C  = "#00d2ff";
const BG = "#0a0a0a";

// ─── "SF" favicon SVG ────────────────────────────────────────────────────────
// Rendered at 64×64 so sharp can scale it down cleanly to 16 or 32.
// Bold "SF" on dark background — readable at any favicon size.
// y=48 baseline centres the cap-height (≈0.73×44=32px) in the 64px box.
function sfFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect width="64" height="64" fill="${BG}" rx="10"/>
  <text x="32" y="48"
        text-anchor="middle"
        font-family="Arial Black, Impact, Arial, sans-serif"
        font-size="44" font-weight="900"
        fill="${C}">SF</text>
</svg>`;
}

// ─── Large icon SVG (192 / 512 / 180 px) ─────────────────────────────────────
// Scaled from the original 430-wide design — looks great at app-icon sizes.
function largeDumbbellSvg(w, h) {
  const scale = w / 430;
  const pw = Math.round(25 * scale), ph = Math.round(80 * scale);
  const cw = Math.round(14 * scale), ch = Math.round(50 * scale);
  const bw = Math.round(58 * scale), bh = Math.round(14 * scale);
  const g  = Math.round(12 * scale);
  const hg = Math.round(6  * scale);

  const totalW = pw + g + cw + hg + bw + hg + cw + g + pw;
  const x0     = Math.round((w - totalW) / 2);
  const cy     = Math.round(h / 2);
  const rx     = (v) => Math.max(1, Math.round(v * scale));

  const rr = (rx_, ry, rw, rh, r) =>
    `<rect x="${rx_}" y="${ry}" width="${rw}" height="${rh}" rx="${r}" fill="${C}"/>`;

  let x = x0;
  const rects = [];
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, rx(12))); x += pw + g;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, rx(7)));  x += cw + hg;
  rects.push(rr(x, cy - Math.round(bh / 2), bw, bh, rx(7)));  x += bw + hg;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, rx(7)));  x += cw + g;
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, rx(12)));

  const corner = Math.round(36 * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}" rx="${corner}"/>
  ${rects.join("\n  ")}
</svg>`;
}

// ─── OG image SVG ─────────────────────────────────────────────────────────────
function ogSvg(w, h) {
  const scale = 1.1;
  const pw = Math.round(26 * scale), ph = Math.round(88 * scale);
  const cw = Math.round(16 * scale), ch = Math.round(55 * scale);
  const bw = Math.round(100 * scale), bh = Math.round(16 * scale);
  const g  = Math.round(12 * scale), hg = Math.round(6 * scale);

  const totalW = pw + g + cw + hg + bw + hg + cw + g + pw;
  const x0     = Math.round((w - totalW) / 2);
  const dumbY  = 195;
  const cy     = dumbY + Math.round(ph / 2);

  const rr = (rx, ry, rw, rh, r) =>
    `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${r}" fill="${C}"/>`;

  let x = x0;
  const rects = [];
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, Math.round(13 * scale))); x += pw + g;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(8 * scale)));  x += cw + hg;
  rects.push(rr(x, cy - Math.round(bh / 2), bw, bh, Math.round(8 * scale)));  x += bw + hg;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(8 * scale)));  x += cw + g;
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, Math.round(13 * scale)));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  ${rects.join("\n  ")}
  <text x="${w / 2}" y="390" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
        font-size="110" font-weight="900" fill="#ffffff" letter-spacing="-4">Smartfood</text>
  <text x="${w / 2}" y="450" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="32" fill="#555555" letter-spacing="-0.5">Smart calorie tracking, naturally</text>
</svg>`;
}

// ─── ICO builder (PNG-in-ICO, no extra deps) ──────────────────────────────────
// Modern browsers support PNG data embedded directly in ICO containers.
function buildIco(images) {
  // images: Array<{ buf: Buffer, width: number, height: number }>
  const count      = images.length;
  const headerSize = 6;
  const dirSize    = 16 * count;
  let   dataOffset = headerSize + dirSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type = ICO
  header.writeUInt16LE(count, 4);

  const dirs = images.map(({ buf, width, height }) => {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(width  >= 256 ? 0 : width,  0);
    dir.writeUInt8(height >= 256 ? 0 : height, 1);
    dir.writeUInt8(0,  2); // color count
    dir.writeUInt8(0,  3); // reserved
    dir.writeUInt16LE(1,  4); // planes
    dir.writeUInt16LE(32, 6); // bit count
    dir.writeUInt32LE(buf.length,  8);
    dir.writeUInt32LE(dataOffset, 12);
    dataOffset += buf.length;
    return dir;
  });

  return Buffer.concat([header, ...dirs, ...images.map((i) => i.buf)]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function svgToPngBuffer(svgStr, w, h) {
  return sharp(Buffer.from(svgStr), { density: 300 })
    .resize(w, h)
    .png()
    .toBuffer();
}

async function savePng(svgStr, w, h, filename) {
  const buf = await svgToPngBuffer(svgStr, w, h);
  fs.writeFileSync(path.join(OUT, filename), buf);
  console.log("✓", filename);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // favicon.ico — "SF" at 16×16 and 32×32 (rendered from 64×64 SVG)
  const sfSvg = sfFaviconSvg();
  const png16 = await sharp(Buffer.from(sfSvg)).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(sfSvg)).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(OUT, "favicon.ico"), buildIco([
    { buf: png16, width: 16, height: 16 },
    { buf: png32, width: 32, height: 32 },
  ]));
  console.log("✓ favicon.ico");

  // favicon.png — "SF" at 32×32
  fs.writeFileSync(path.join(OUT, "favicon.png"), png32);
  console.log("✓ favicon.png");

  // app icons — dumbbell (unchanged)
  await savePng(largeDumbbellSvg(192, 192), 192, 192, "icon-192.png");
  await savePng(largeDumbbellSvg(512, 512), 512, 512, "icon-512.png");
  await savePng(largeDumbbellSvg(180, 180), 180, 180, "apple-touch-icon.png");

  // OG image — dumbbell (unchanged)
  await savePng(ogSvg(1200, 630), 1200, 630, "og-image.png");

  console.log("\nAll icons generated in /public");
})();
