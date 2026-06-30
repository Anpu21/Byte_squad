import { cn } from '@/lib/utils';

export default function AuthBrandScene({ className }: { className?: string }) {
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
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(0)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(30)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(60)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(90)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(120)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(150)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(180)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(210)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(240)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(270)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(300)" />
                <rect x="-2.2" y="-58" width="4.4" height="13" rx="2.2" fill="#F4CB6B" opacity="0.85" transform="rotate(330)" />
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

          {/* hanging OPEN sign */}
          <g transform="translate(96 120)">
            <rect x="-30" y="0" width="30" height="4" rx="2" fill="#5A5142" />
            <g
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'top',
                animation: 'lp-swing 3.6s ease-in-out infinite',
              }}
            >
              <line x1="-15" y1="2" x2="-15" y2="16" stroke="#5A5142" strokeWidth="2" />
              <g style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <rect x="-37" y="16" width="44" height="22" rx="5" fill="#2A2317" />
                <text
                  x="-15"
                  y="31"
                  textAnchor="middle"
                  fontFamily="'Hanken Grotesk',sans-serif"
                  fontSize="10"
                  fontWeight="700"
                  letterSpacing="0.6"
                  fill="#EBE4D3"
                >
                  OPEN
                </text>
              </g>
            </g>
          </g>

          {/* storefront */}
          <rect x="104" y="110" width="152" height="86" rx="4" fill="#F5EFE2" stroke="#E5DBC6" strokeWidth="2" />

          {/* awning */}
          <g>
            <rect x="98" y="120" width="164" height="9" rx="3" fill="#7C8C50" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(2 0)" fill="#8B9B5C" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(24 0)" fill="#F2ECDD" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(46 0)" fill="#8B9B5C" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(68 0)" fill="#F2ECDD" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(90 0)" fill="#8B9B5C" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(112 0)" fill="#F2ECDD" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(134 0)" fill="#8B9B5C" />
            <path d="M98 129 q11 0 11 11 h-22 q0 -11 11 -11 Z" transform="translate(156 0)" fill="#F2ECDD" />
          </g>

          {/* window with warm glow */}
          <rect
            x="119"
            y="150"
            width="52"
            height="40"
            rx="6"
            fill="url(#lpWin)"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'lp-pulse 3.8s ease-in-out infinite',
            }}
          />
          <rect x="119" y="150" width="52" height="40" rx="6" fill="none" stroke="#C9A86F" strokeWidth="2.5" />
          <line x1="145" y1="150" x2="145" y2="190" stroke="#C9A86F" strokeWidth="2" />
          <line x1="119" y1="170" x2="171" y2="170" stroke="#C9A86F" strokeWidth="2" />

          {/* door */}
          <rect x="190" y="150" width="46" height="46" rx="5" fill="#C79A63" />
          <rect x="190" y="150" width="46" height="46" rx="5" fill="none" stroke="#A87E48" strokeWidth="2" />
          <circle cx="229" cy="174" r="2.4" fill="#6E5126" />

          {/* potted plant */}
          <g transform="translate(248 196)">
            <g
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'bottom',
                animation: 'lp-leaf 4.2s ease-in-out infinite',
              }}
            >
              <path d="M0 -8 C-12 -14 -13 -28 -3 -34 C0 -24 1 -16 0 -8 Z" fill="#7E9A4F" />
              <path d="M0 -8 C12 -16 14 -30 3 -36 C-1 -25 -1 -16 0 -8 Z" fill="#8FAA5C" />
              <path d="M0 -6 C-3 -18 1 -30 0 -34 C-1 -30 -5 -18 0 -6 Z" fill="#9DB86A" />
            </g>
            <path d="M-9 -8 H9 L6 6 H-6 Z" fill="#C77F4E" />
          </g>

          {/* sparkles */}
          <path
            d="M306 64 Q307 60 311 59 Q307 58 306 54 Q305 58 301 59 Q305 60 306 64 Z"
            fill="#FBE3A0"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'lp-twinkle 2.6s ease-in-out infinite',
            }}
          />
          <path
            d="M228 118 Q229 115 232 114 Q229 113 228 110 Q227 113 224 114 Q227 115 228 118 Z"
            fill="#FBE3A0"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'lp-twinkle 2.9s ease-in-out infinite 0.8s',
            }}
          />
          <path
            d="M84 150 Q85 147 88 146 Q85 145 84 142 Q83 145 80 146 Q83 147 84 150 Z"
            fill="#EBC76A"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'lp-twinkle 3.2s ease-in-out infinite 1.6s',
            }}
          />
        </g>
      </svg>
    </div>
  );
}
