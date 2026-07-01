import { cn } from '@/lib/utils';
import { Sparkle, StoreScene, type AuthScenePalette } from './auth-scene-parts';

/** Star field — small ivory dots that twinkle on staggered delays. */
const STARS: ReadonlyArray<{ x: number; y: number; r: number; d: string }> = [
  { x: 38, y: 42, r: 1.4, d: '0s' },
  { x: 68, y: 26, r: 1, d: '.5s' },
  { x: 104, y: 50, r: 1.2, d: '1s' },
  { x: 148, y: 32, r: 1, d: '.3s' },
  { x: 190, y: 46, r: 1.4, d: '1.4s' },
  { x: 222, y: 30, r: 1, d: '1.9s' },
  { x: 58, y: 74, r: 1, d: '.9s' },
  { x: 26, y: 96, r: 1.2, d: '1.7s' },
  { x: 322, y: 56, r: 1.2, d: '.7s' },
  { x: 336, y: 104, r: 1, d: '1.2s' },
];

const NIGHT_PALETTE: AuthScenePalette = {
  signBar: '#4A4236',
  signBoard: '#221C2E',
  signText: '#F0C765',
  facade: '#D7CEBA',
  facadeStroke: '#BCB29A',
  awningBar: '#56633A',
  awningA: '#6B7A47',
  awningB: '#CFC8B4',
  windowGradId: 'lpNWin',
  windowPulse: '3s',
  door: '#A67E4E',
  doorStroke: '#7E5C34',
  doorKnob: '#5A421F',
  plantA: '#536535',
  plantB: '#5E7140',
  plantC: '#6B7D4A',
  pot: '#9A6238',
};

/** Nighttime storefront brand scene (dark theme). Moon, stars, glowing window. */
export default function AuthBrandSceneNight({ className }: { className?: string }) {
  return (
    <div
      style={{
        borderRadius: '24px',
        boxShadow: '0 30px 64px -34px rgba(12,16,38,.6)',
        lineHeight: 0,
      }}
      className={cn(className)}
    >
      <svg viewBox="0 0 360 268" style={{ width: '100%', display: 'block' }} aria-hidden="true">
        <defs>
          <clipPath id="lpNCard">
            <rect x="6" y="6" width="348" height="252" rx="24" />
          </clipPath>
          <linearGradient id="lpNSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#16233F" />
            <stop offset="0.55" stopColor="#33335C" />
            <stop offset="1" stopColor="#6E5560" />
          </linearGradient>
          <radialGradient id="lpMoonGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F4ECD8" stopOpacity="0.45" />
            <stop offset="0.6" stopColor="#E9DFC4" stopOpacity="0.12" />
            <stop offset="1" stopColor="#E9DFC4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lpMoonDisc" cx="0.4" cy="0.36" r="0.7">
            <stop offset="0" stopColor="#FBF6E6" />
            <stop offset="1" stopColor="#E4D8BC" />
          </radialGradient>
          <radialGradient id="lpNWin" cx="0.5" cy="0.35" r="0.78">
            <stop offset="0" stopColor="#FFE9A8" />
            <stop offset="1" stopColor="#F2BE5A" />
          </radialGradient>
          <radialGradient id="lpPool" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F4C260" stopOpacity="0.55" />
            <stop offset="1" stopColor="#F4C260" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath="url(#lpNCard)">
          <rect x="6" y="6" width="348" height="252" fill="url(#lpNSky)" />

          {/* stars */}
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#F3ECD6"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `lp-twinkle 3s ease-in-out infinite ${s.d}`,
              }}
            />
          ))}

          {/* moon */}
          <g style={{ animation: 'lp-sunrise 1.2s cubic-bezier(.22,1,.36,1) .55s both' }}>
            <g transform="translate(278 84)">
              <circle r="58" fill="url(#lpMoonGlow)" style={{ animation: 'lp-pulse 5s ease-in-out infinite' }} />
              <g
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: 'lp-bob 6s ease-in-out infinite',
                }}
              >
                <circle r="27" fill="url(#lpMoonDisc)" />
                <circle r="27" fill="none" stroke="#FBF1D8" strokeWidth="1.5" opacity="0.5" />
                <circle cx="-8" cy="-6" r="5" fill="#E2D4B4" opacity="0.55" />
                <circle cx="7" cy="5" r="6.5" fill="#E2D4B4" opacity="0.5" />
                <circle cx="10" cy="-9" r="3.2" fill="#E2D4B4" opacity="0.5" />
                <circle cx="-3" cy="12" r="3.6" fill="#E2D4B4" opacity="0.45" />
              </g>
            </g>
          </g>

          {/* thin dusky cloud */}
          <g transform="translate(0 132)">
            <g style={{ animation: 'lp-cloud 40s linear infinite 4s' }} opacity="0.5">
              <ellipse cx="40" cy="0" rx="22" ry="9" fill="#3A3A57" />
              <ellipse cx="60" cy="4" rx="16" ry="7" fill="#3A3A57" />
            </g>
          </g>

          {/* ground */}
          <rect x="6" y="196" width="348" height="62" fill="#241F33" />
          <rect x="6" y="196" width="348" height="4" fill="#312A44" />

          {/* warm light pool spilling from the window */}
          <ellipse cx="145" cy="206" rx="46" ry="11" fill="url(#lpPool)" />

          <StoreScene p={NIGHT_PALETTE} />

          {/* foreground twinkles */}
          <Sparkle
            d="M306 60 Q307 56 311 55 Q307 54 306 50 Q305 54 301 55 Q305 56 306 60 Z"
            fill="#FBE3A0"
            dur="2.6s"
          />
          <Sparkle
            d="M84 150 Q85 147 88 146 Q85 145 84 142 Q83 145 80 146 Q83 147 84 150 Z"
            fill="#F0CE84"
            dur="3.2s"
            delay="1.6s"
          />
        </g>
      </svg>
    </div>
  );
}
