/**
 * Generates all static icon/OG PNG files into /public using sharp.
 * Run: node scripts/generate-icons.js
 *
 * Dumbbell layout (left to right): plate | gap | collar | half-gap | bar | half-gap | collar | gap | plate
 * All values are in pixels, scaled per icon size.
 */

const sharp = require("sharp");
const path  = require("path");
const fs    = require("fs");

const OUT = path.join(__dirname, "..", "public");
fs.mkdirSync(OUT, { recursive: true });

const C  = "#00d2ff"; // neon cyan
const BG = "#0a0a0a"; // near-black

/**
 * Build an SVG string for a dumbbell icon centered in (w × h).
 * All rect sizes are derived from the `scale` parameter.
 */
function dumbbellSvg(w, h, scale = 1) {
  const pw = Math.round(25 * scale), ph = Math.round(80 * scale);   // plate
  const cw = Math.round(14 * scale), ch = Math.round(50 * scale);   // collar
  const bw = Math.round(58 * scale), bh = Math.round(14 * scale);   // bar
  const g  = Math.round(12 * scale);                                  // gap plate→collar
  const hg = Math.round(6  * scale);                                  // gap collar→bar

  const totalW = pw + g + cw + hg + bw + hg + cw + g + pw;
  const x0     = Math.round((w - totalW) / 2);
  const cy     = Math.round(h / 2);

  const rr = (rx, ry, rw, rh, radius) =>
    `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${radius}" ry="${radius}" fill="${C}"/>`;

  let x = x0;
  const rects = [];

  // left plate
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, Math.round(12 * scale)));
  x += pw + g;
  // left collar
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(7 * scale)));
  x += cw + hg;
  // bar
  rects.push(rr(x, cy - Math.round(bh / 2), bw, bh, Math.round(7 * scale)));
  x += bw + hg;
  // right collar
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(7 * scale)));
  x += cw + g;
  // right plate
  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, Math.round(12 * scale)));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${BG}" rx="${Math.round(36 * scale)}"/>
  ${rects.join("\n  ")}
</svg>`;
}

/** OG image: dumbbell + "Smartfood" title + tagline, no border-radius */
function ogSvg(w, h) {
  const scale = 1.1;
  const pw = Math.round(26 * scale), ph = Math.round(88 * scale);
  const cw = Math.round(16 * scale), ch = Math.round(55 * scale);
  const bw = Math.round(100 * scale), bh = Math.round(16 * scale);
  const g  = Math.round(12 * scale);
  const hg = Math.round(6  * scale);

  const totalW = pw + g + cw + hg + bw + hg + cw + g + pw;
  const x0     = Math.round((w - totalW) / 2);
  const dumbY  = 195; // vertical center of dumbbell group
  const cy     = dumbY + Math.round(ph / 2);

  const rr = (rx, ry, rw, rh, radius) =>
    `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${radius}" ry="${radius}" fill="${C}"/>`;

  let x = x0;
  const rects = [];

  rects.push(rr(x, cy - Math.round(ph / 2), pw, ph, Math.round(13 * scale)));
  x += pw + g;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(8 * scale)));
  x += cw + hg;
  rects.push(rr(x, cy - Math.round(bh / 2), bw, bh, Math.round(8 * scale)));
  x += bw + hg;
  rects.push(rr(x, cy - Math.round(ch / 2), cw, ch, Math.round(8 * scale)));
  x += cw + g;
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

async function gen(svgStr, outFile, opts = {}) {
  const buf = Buffer.from(svgStr);
  let img = sharp(buf, { density: 300 });
  if (opts.resize) img = img.resize(opts.resize.w, opts.resize.h);
  await img.png().toFile(outFile);
  console.log("✓", path.relative(path.join(__dirname, ".."), outFile));
}

(async () => {
  // 192×192 icon (manifest any)
  await gen(dumbbellSvg(192, 192, 192 / 430), path.join(OUT, "icon-192.png"));

  // 512×512 icon (manifest maskable / any)
  await gen(dumbbellSvg(512, 512, 512 / 430), path.join(OUT, "icon-512.png"));

  // 180×180 apple touch icon (rounded corners baked in)
  await gen(dumbbellSvg(180, 180, 180 / 430), path.join(OUT, "apple-touch-icon.png"));

  // 32×32 favicon PNG (browsers accept PNG favicon via <link>)
  await gen(dumbbellSvg(32, 32, 32 / 430), path.join(OUT, "favicon.png"), {
    resize: { w: 32, h: 32 },
  });

  // 1200×630 OG image
  await gen(ogSvg(1200, 630), path.join(OUT, "og-image.png"));

  console.log("\nAll icons generated in /public");
})();
