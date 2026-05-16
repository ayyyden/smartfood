import { ImageResponse } from "next/og";

export const size        = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  const s   = 192;
  const pw  = 25,  ph  = 80;   // plate
  const cw  = 14,  ch  = 50;   // collar
  const bw  = 58,  bh  = 14;   // bar
  const g   = 12,  hg  = 6;
  const C   = "#00d2ff";

  return new ImageResponse(
    <div
      style={{
        width: s,
        height: s,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: pw, height: ph, background: C, borderRadius: 12 }} />
        <div style={{ width: g }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 7 }} />
        <div style={{ width: hg }} />
        <div style={{ width: bw, height: bh, background: C, borderRadius: 7 }} />
        <div style={{ width: hg }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 7 }} />
        <div style={{ width: g }} />
        <div style={{ width: pw, height: ph, background: C, borderRadius: 12 }} />
      </div>
    </div>,
    { width: s, height: s }
  );
}
