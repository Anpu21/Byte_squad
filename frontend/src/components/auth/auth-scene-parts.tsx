export interface AuthScenePalette {
  signBar: string;
  signBoard: string;
  signText: string;
  facade: string;
  facadeStroke: string;
  awningBar: string;
  /** Colored awning stripe (odd stripes). */
  awningA: string;
  /** Light awning stripe (even stripes). */
  awningB: string;
  windowGradId: string;
  windowPulse: string;
  door: string;
  doorStroke: string;
  doorKnob: string;
  plantA: string;
  plantB: string;
  plantC: string;
  pot: string;
}

const STRIPES = [2, 24, 46, 68, 90, 112, 134, 156];

/**
 * Shared storefront used by both auth brand scenes: the hanging OPEN sign,
 * facade, striped awning, glowing window, door, and potted plant. Colours come
 * from the day/night palette so the markup (and DOM order) stays identical.
 */
export function StoreScene({ p }: { p: AuthScenePalette }) {
  return (
    <>
      <g transform="translate(96 120)">
        <rect x="-30" y="0" width="30" height="4" rx="2" fill={p.signBar} />
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'top',
            animation: 'lp-swing 3.6s ease-in-out infinite',
          }}
        >
          <line x1="-15" y1="2" x2="-15" y2="16" stroke={p.signBar} strokeWidth="2" />
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x="-37" y="16" width="44" height="22" rx="5" fill={p.signBoard} />
            <text
              x="-15"
              y="31"
              textAnchor="middle"
              fontFamily="'Hanken Grotesk',sans-serif"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.6"
              fill={p.signText}
            >
              OPEN
            </text>
          </g>
        </g>
      </g>

      <rect
        x="104"
        y="110"
        width="152"
        height="86"
        rx="4"
        fill={p.facade}
        stroke={p.facadeStroke}
        strokeWidth="2"
      />

      <g>
        <rect x="98" y="120" width="164" height="9" rx="3" fill={p.awningBar} />
        {STRIPES.map((tx, i) => (
          <path
            key={tx}
            d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z"
            transform={`translate(${tx} 0)`}
            fill={i % 2 === 0 ? p.awningA : p.awningB}
          />
        ))}
      </g>

      <rect
        x="119"
        y="150"
        width="52"
        height="40"
        rx="6"
        fill={`url(#${p.windowGradId})`}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: `lp-pulse ${p.windowPulse} ease-in-out infinite`,
        }}
      />
      <rect x="119" y="150" width="52" height="40" rx="6" fill="none" stroke="#C9A86F" strokeWidth="2.5" />
      <line x1="145" y1="150" x2="145" y2="190" stroke="#C9A86F" strokeWidth="2" />
      <line x1="119" y1="170" x2="171" y2="170" stroke="#C9A86F" strokeWidth="2" />

      <rect x="190" y="150" width="46" height="46" rx="5" fill={p.door} />
      <rect x="190" y="150" width="46" height="46" rx="5" fill="none" stroke={p.doorStroke} strokeWidth="2" />
      <circle cx="229" cy="174" r="2.4" fill={p.doorKnob} />

      <g transform="translate(248 196)">
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'bottom',
            animation: 'lp-leaf 4.2s ease-in-out infinite',
          }}
        >
          <path d="M0 -8 C-12 -14 -13 -28 -3 -34 C0 -24 1 -16 0 -8 Z" fill={p.plantA} />
          <path d="M0 -8 C12 -16 14 -30 3 -36 C-1 -25 -1 -16 0 -8 Z" fill={p.plantB} />
          <path d="M0 -6 C-3 -18 1 -30 0 -34 C-1 -30 -5 -18 0 -6 Z" fill={p.plantC} />
        </g>
        <path d="M-9 -8 H9 L6 6 H-6 Z" fill={p.pot} />
      </g>
    </>
  );
}

/** One twinkling sparkle path, animated on a staggered delay. */
export function Sparkle({
  d,
  fill,
  dur = '2.6s',
  delay = '0s',
}: {
  d: string;
  fill: string;
  dur?: string;
  delay?: string;
}) {
  return (
    <path
      d={d}
      fill={fill}
      style={{
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animation: `lp-twinkle ${dur} ease-in-out infinite ${delay}`,
      }}
    />
  );
}
