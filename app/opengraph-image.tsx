import { ImageResponse } from "next/og";

export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const C  = "#00d2ff";
  const pw = 26, ph = 88, cw = 16, ch = 55, bw = 100, bh = 16, g = 12, hg = 6;

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      {/* Dumbbell */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: pw, height: ph, background: C, borderRadius: 13 }} />
        <div style={{ width: g }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 8 }} />
        <div style={{ width: hg }} />
        <div style={{ width: bw, height: bh, background: C, borderRadius: 8 }} />
        <div style={{ width: hg }} />
        <div style={{ width: cw, height: ch, background: C, borderRadius: 8 }} />
        <div style={{ width: g }} />
        <div style={{ width: pw, height: ph, background: C, borderRadius: 13 }} />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-4px",
          marginTop: 40,
          lineHeight: 1,
        }}
      >
        Smartfood
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 30,
          color: "#555555",
          marginTop: 20,
          letterSpacing: "-0.3px",
        }}
      >
        Smart calorie tracking, naturally
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
