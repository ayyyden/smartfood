export default function DumbbellLogo({
  size = 24,
  color = "#00d2ff",
  glow = 0.35,
}: {
  size?: number;
  color?: string;
  glow?: number;
}) {
  const glowPx = Math.round(size * 0.22);
  const filterStr =
    glow > 0 ? `drop-shadow(0 0 ${glowPx}px ${color})` : undefined;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.5)}
      viewBox="0 0 32 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={filterStr ? { filter: filterStr } : undefined}
    >
      {/* Left outer plate */}
      <rect x="0" y="1" width="5" height="14" rx="2.5" fill={color} />
      {/* Left inner collar */}
      <rect x="5.5" y="4" width="3" height="8" rx="1.5" fill={color} />
      {/* Bar */}
      <rect x="8.5" y="7" width="15" height="2" rx="1" fill={color} />
      {/* Right inner collar */}
      <rect x="23.5" y="4" width="3" height="8" rx="1.5" fill={color} />
      {/* Right outer plate */}
      <rect x="27" y="1" width="5" height="14" rx="2.5" fill={color} />
    </svg>
  );
}
