import { ImageResponse } from "next/og";

const SIZES = {
  favicon: { width: 64, height: 64 },
  w192:    { width: 192, height: 192 },
  w512:    { width: 512, height: 512 },
};

export function generateImageMetadata() {
  return Object.entries(SIZES).map(([id, size]) => ({
    id,
    contentType: "image/png" as const,
    size,
  }));
}

function Dumbbell({ s }: { s: number }) {
  const pw  = Math.round(s * 0.13);   // plate width
  const ph  = Math.round(s * 0.42);   // plate height
  const cw  = Math.round(s * 0.075);  // collar width
  const ch  = Math.round(s * 0.26);   // collar height
  const bw  = Math.round(s * 0.30);   // bar width
  const bh  = Math.round(s * 0.075);  // bar height
  const g   = Math.round(s * 0.065);  // gap
  const hg  = Math.round(g * 0.5);
  const C   = "#00d2ff";
  const glow = `0 0 ${Math.round(s * 0.2)}px rgba(0,210,255,0.8)`;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: pw, height: ph, background: C, borderRadius: pw / 2, boxShadow: glow }} />
      <div style={{ width: g }} />
      <div style={{ width: cw, height: ch, background: C, borderRadius: cw / 2, boxShadow: glow }} />
      <div style={{ width: hg }} />
      <div style={{ width: bw, height: bh, background: C, borderRadius: bh / 2, boxShadow: glow }} />
      <div style={{ width: hg }} />
      <div style={{ width: cw, height: ch, background: C, borderRadius: cw / 2, boxShadow: glow }} />
      <div style={{ width: g }} />
      <div style={{ width: pw, height: ph, background: C, borderRadius: pw / 2, boxShadow: glow }} />
    </div>
  );
}

export default function Icon({ id }: { id: string }) {
  const size = SIZES[id as keyof typeof SIZES] ?? SIZES.favicon;
  const s    = size.width;
  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Dumbbell s={s} />
    </div>,
    size
  );
}
