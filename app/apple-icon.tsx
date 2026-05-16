import { ImageResponse } from "next/og";

export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const s   = 180;
  const pw  = 23,  ph  = 75;
  const cw  = 13,  ch  = 47;
  const bw  = 54,  bh  = 13;
  const g   = 11,  hg  = 5;
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
        borderRadius: 36,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: pw, height: ph, background: C, borderRadius: 11 }} />
        <div style={{ width: g }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 6 }} />
        <div style={{ width: hg }} />
        <div style={{ width: bw, height: bh, background: C, borderRadius: 6 }} />
        <div style={{ width: hg }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 6 }} />
        <div style={{ width: g }} />
        <div style={{ width: pw, height: ph, background: C, borderRadius: 11 }} />
      </div>
    </div>,
    { width: s, height: s }
  );
}
