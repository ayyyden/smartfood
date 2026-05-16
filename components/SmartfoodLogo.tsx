export default function SmartfoodLogo({
  size  = 24,
  color = "#ffffff",
  glow  = 0.3,
}: {
  size?:  number;
  color?: string;
  glow?:  number;
}) {
  const dropShadow = glow > 0
    ? { filter: `drop-shadow(0 0 5px ${color})` }
    : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={dropShadow}
    >
      <path
        d="M6 2 H26 Q30 2 30 6 V20 Q30 24 26 24 H20 L16 30 L13 24 H6 Q2 24 2 20 V6 Q2 2 6 2 Z"
        fill="rgba(255,255,255,0.1)"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="7"  y1="9"  x2="25" y2="9"  stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9"  y1="14" x2="23" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <line x1="12" y1="19" x2="20" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}
