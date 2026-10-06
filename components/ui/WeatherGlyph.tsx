import type { SkyKind } from "@/lib/weather-codes";

type Props = { kind: SkyKind; isDay: boolean; size?: number; className?: string; animate?: boolean };

const CLOUD = "M7 17.5h10.2a3.8 3.8 0 0 0 .5-7.57A5.5 5.5 0 0 0 7.1 9.6 4 4 0 0 0 7 17.5Z";

/** Line-art weather glyphs. Animation is CSS-only and switched off by prefers-reduced-motion globally. */
export function WeatherGlyph({ kind, isDay, size = 28, className = "", animate = true }: Props) {
  const a = animate;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {kind === "clear" && isDay && (
        <g style={a ? { transformOrigin: "12px 12px", animation: "spin-slow 60s linear infinite" } : undefined}>
          <circle cx="12" cy="12" r="4.2" />
          {Array.from({ length: 8 }, (_, i) => {
            const t = (i * Math.PI) / 4;
            return <path key={i} d={`M${12 + Math.cos(t) * 7},${12 + Math.sin(t) * 7}L${12 + Math.cos(t) * 9.4},${12 + Math.sin(t) * 9.4}`} />;
          })}
        </g>
      )}
      {kind === "clear" && !isDay && (
        <>
          <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
          <path d="M17 4v2M16 5h2" style={a ? { animation: "breathe 3s ease-in-out infinite" } : undefined} />
        </>
      )}
      {(kind === "cloud" || kind === "fog" || kind === "drizzle" || kind === "rain" || kind === "storm" || kind === "snow") && (
        <g style={a && kind === "cloud" ? { animation: "drift 7s ease-in-out infinite" } : undefined}>
          <path d={CLOUD} transform={kind === "cloud" ? "" : "translate(0 -3)"} />
        </g>
      )}
      {kind === "cloud" && isDay && <path d="M16 4.2a3.2 3.2 0 0 1 3.7 3.4" style={{ opacity: 0.7 }} />}
      {kind === "fog" && (
        <>
          <path d="M5 17h14M7 20h10" />
        </>
      )}
      {(kind === "rain" || kind === "drizzle") && (
        <g>
          {[8.5, 12, 15.5].map((x, i) => (
            <path key={x} d={`M${x} 17.5l-1 2.8`} style={a ? { animation: `fall 1.1s ${i * 0.25}s linear infinite` } : undefined} />
          ))}
        </g>
      )}
      {kind === "storm" && <path d="M12.5 15l-2.2 3.5h3.2L11.6 22" style={a ? { animation: "blink 2.4s steps(1) infinite" } : undefined} />}
      {kind === "snow" && (
        <g>
          {[8.5, 12, 15.5].map((x, i) => (
            <circle key={x} cx={x} cy={19} r="0.6" style={a ? { animation: `fall 1.8s ${i * 0.3}s linear infinite` } : undefined} />
          ))}
        </g>
      )}
    </svg>
  );
}
