import { ImageResponse } from "next/og";

export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const C    = "#00d2ff";
  const glow = "0 0 60px rgba(0,210,255,0.9)";

  // Dumbbell at ~220px wide, ~88px tall
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
        position: "relative",
      }}
    >
      {/* Subtle center glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,210,255,0.055) 0%, transparent 100%)",
        }}
      />

      {/* Dumbbell */}
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

      {/* Title */}
      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-4px",
          marginTop: 36,
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
          fontWeight: 400,
        }}
      >
        Smart calorie tracking, naturally
      </div>

      {/* Domain */}
      <div
        style={{
          fontSize: 18,
          color: "#2a2a2a",
          marginTop: 40,
          letterSpacing: "0.5px",
        }}
      >
        smartfood-eight.vercel.app
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
