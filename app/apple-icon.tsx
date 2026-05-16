import { ImageResponse } from "next/og";

export const size         = { width: 180, height: 180 };
export const contentType  = "image/png";

export default function AppleIcon() {
  const s   = 180;
  const pw  = Math.round(s * 0.13);
  const ph  = Math.round(s * 0.42);
  const cw  = Math.round(s * 0.075);
  const ch  = Math.round(s * 0.26);
  const bw  = Math.round(s * 0.30);
  const bh  = Math.round(s * 0.075);
  const g   = Math.round(s * 0.065);
  const hg  = Math.round(g * 0.5);
  const C   = "#00d2ff";
  const glow = `0 0 ${Math.round(s * 0.18)}px rgba(0,210,255,0.8)`;

  return new ImageResponse(
    <div
      style={{
        width: s,
        height: s,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 36,
      }}
    >
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
    </div>,
    { width: s, height: s }
  );
}
