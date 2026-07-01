import { cn } from '@/lib/utils';
import { Sparkle, StoreScene, type AuthScenePalette } from './auth-scene-parts';

const DAY_PALETTE: AuthScenePalette = {
  signBar: '#5A5142',
  signBoard: '#2A2317',
  signText: '#EBE4D3',
  facade: '#F5EFE2',
  facadeStroke: '#E5DBC6',
  awningBar: '#7C8C50',
  awningA: '#8B9B5C',
  awningB: '#F2ECDD',
  windowGradId: 'lpWin',
  windowPulse: '3.8s',
  door: '#C79A63',
  doorStroke: '#A87E48',
  doorKnob: '#6E5126',
  plantA: '#7E9A4F',
  plantB: '#8FAA5C',
  plantC: '#9DB86A',
  pot: '#C77F4E',
};

const RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/** Daytime storefront brand scene (light theme). Rising sun, warm sky, birds. */
export default function AuthBrandSceneDay({ className }: { className?: string }) {
  return (
    <div
      style={{
        borderRadius: '24px',
        boxShadow: '0 30px 64px -34px rgba(70,52,28,.6)',
        lineHeight: 0,
      }}
      className={cn(className)}
    >
      <svg viewBox="0 0 360 268" style={{ width: '100%', display: 'block' }} aria-hidden="true">
        <defs>
          <clipPath id="lpCard">
            <rect x="6" y="6" width="348" height="252" rx="24" />
          </clipPath>
          <linearGradient id="lpSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BBD6D9" />
            <stop offset="0.52" stopColor="#F4E3C3" />
            <stop offset="1" stopColor="#FBEBD3" />
          </linearGradient>
          <radialGradient id="lpSunGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F7C765" stopOpacity="0.6" />
            <stop offset="0.6" stopColor="#F4BC55" stopOpacity="0.16" />
            <stop offset="1" stopColor="#F4BC55" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lpSunDisc" cx="0.42" cy="0.38" r="0.65">
            <stop offset="0" stopColor="#FBD884" />
            <stop offset="1" stopColor="#F0B441" />
          </radialGradient>
          <radialGradient id="lpWin" cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#FCEAAC" />
            <stop offset="1" stopColor="#F2CE71" />
          </radialGradient>
        </defs>

        <g clipPath="url(#lpCard)">
          <rect x="6" y="6" width="348" height="252" fill="url(#lpSky)" />

          {/* clouds */}
          <g transform="translate(0 56)">
            <g style={{ animation: 'lp-cloud 26s linear infinite' }} opacity="0.85">
              <ellipse cx="60" cy="0" rx="26" ry="14" fill="#FFFDF8" />
              <ellipse cx="84" cy="6" rx="20" ry="12" fill="#FFFDF8" />
              <ellipse cx="40" cy="6" rx="16" ry="10" fill="#FFFDF8" />
            </g>
          </g>
          <g transform="translate(0 120)">
            <g style={{ animation: 'lp-cloud 34s linear infinite 6s' }} opacity="0.7">
              <ellipse cx="40" cy="0" rx="20" ry="11" fill="#FFFEFA" />
              <ellipse cx="58" cy="5" rx="15" ry="9" fill="#FFFEFA" />
            </g>
          </g>

          {/* sun */}
          <g style={{ animation: 'lp-sunrise 1.2s cubic-bezier(.22,1,.36,1) .55s both' }}>
            <g transform="translate(266 92)">
              <circle r="64" fill="url(#lpSunGlow)" style={{ animation: 'lp-pulse 4.4s ease-in-out infinite' }} />
              <g
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: 'lp-rays 46s linear infinite',
                }}
              >
                {RAYS.map((a) => (
                  <rect
                    key={a}
                    x="-2.2"
                    y="-58"
                    width="4.4"
                    height="13"
                    rx="2.2"
                    fill="#F4CB6B"
                    opacity="0.85"
                    transform={`rotate(${a})`}
                  />
                ))}
              </g>
              <g
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: 'lp-bob 5.4s ease-in-out infinite',
                }}
              >
                <circle r="34" fill="url(#lpSunDisc)" />
                <circle r="34" fill="none" stroke="#FBE0A0" strokeWidth="2" opacity="0.6" />
              </g>
            </g>
          </g>

          {/* birds */}
          <g style={{ animation: 'lp-bird 15s linear infinite 1.5s' }}>
            <g
              transform="translate(70 70)"
              stroke="#6E6452"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: 'lp-flap 0.5s ease-in-out infinite',
              }}
            >
              <path d="M0 0 Q5 -5 10 0" />
              <path d="M10 0 Q15 -5 20 0" />
            </g>
          </g>
          <g style={{ animation: 'lp-bird 18s linear infinite 5s' }}>
            <g
              transform="translate(40 48) scale(0.8)"
              stroke="#6E6452"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: 'lp-flap 0.6s ease-in-out infinite',
              }}
            >
              <path d="M0 0 Q5 -5 10 0" />
              <path d="M10 0 Q15 -5 20 0" />
            </g>
          </g>

          {/* ground */}
          <rect x="6" y="196" width="348" height="62" fill="#ECE0C9" />
          <rect x="6" y="196" width="348" height="4" fill="#E0D2B6" />

          <StoreScene p={DAY_PALETTE} />

          {/* sparkles */}
          <Sparkle
            d="M306 64 Q307 60 311 59 Q307 58 306 54 Q305 58 301 59 Q305 60 306 64 Z"
            fill="#FBE3A0"
            dur="2.6s"
          />
          <Sparkle
            d="M228 118 Q229 115 232 114 Q229 113 228 110 Q227 113 224 114 Q227 115 228 118 Z"
            fill="#FBE3A0"
            dur="2.9s"
            delay="0.8s"
          />
          <Sparkle
            d="M84 150 Q85 147 88 146 Q85 145 84 142 Q83 145 80 146 Q83 147 84 150 Z"
            fill="#EBC76A"
            dur="3.2s"
            delay="1.6s"
          />
        </g>
      </svg>
    </div>
  );
}
