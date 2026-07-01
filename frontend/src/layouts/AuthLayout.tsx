import { Outlet } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AuthBrandScene from '@/components/auth/AuthBrandScene';

/** Time-of-day greeting for the brand panel (mirrors the source design). */
function greetingForNow(): string {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
}

/**
 * Split-screen auth shell shared by login / signup / OTP / forgot / reset /
 * select-branch. Left = the form column (each page renders its own `Logo` +
 * heading + form via `<Outlet/>`). Right (desktop only) = the brand panel:
 * an animated storefront scene, a time-based greeting, and an editorial tagline.
 *
 * Fully theme-aware on our tokens — `bg-surface` / `bg-primary` resolve to the
 * warm espresso + cream pairing in dark (≈ the source mockup) and a white +
 * indigo pairing in light. All motion is covered by the global reduced-motion
 * guard in `index.css`.
 */
export default function AuthLayout() {
    return (
        <div className="flex min-h-screen overflow-hidden bg-canvas font-sans text-text-1">
            {/* ── Form column ─────────────────────────────────────────────── */}
            <section className="relative flex flex-1 flex-col justify-center bg-surface px-6 py-12 sm:px-10 lg:flex-[1.3]">
                <div className="absolute right-4 top-4 z-10">
                    <ThemeToggle />
                </div>

                <div className="mx-auto w-full max-w-[424px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Outlet />
                </div>

                {/* Ambient stat tile — decorative, very-wide screens only. */}
                <div
                    className="pointer-events-none absolute bottom-7 right-7 hidden w-[188px] rounded-2xl border border-border bg-surface-2 p-4 shadow-lg-token 2xl:block"
                    style={{ animation: 'lp-pop .6s cubic-bezier(.34,1.56,.64,1) .9s both' }}
                    aria-hidden="true"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-3">
                                Today
                            </div>
                            <div className="mt-1 font-display text-[26px] font-bold leading-none text-text-1">
                                1,284
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-1.5 py-1 text-[11.5px] font-bold leading-none text-accent-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 14.5 9.5 9l3.5 3.5L20 5" />
                                <path d="M15 5h5v5" />
                            </svg>
                            12%
                        </span>
                    </div>
                    <div className="mt-3.5 flex h-10 items-end gap-1.5">
                        {[
                            { c: 'bg-surface-3', d: '0s' },
                            { c: 'bg-surface-3', d: '.5s' },
                            { c: 'bg-border-strong', d: '.9s' },
                            { c: 'bg-surface-3', d: '.25s' },
                            { c: 'bg-accent', d: '.7s' },
                        ].map((b, i) => (
                            <span
                                key={i}
                                className={`h-full flex-1 origin-bottom rounded-t ${b.c}`}
                                style={{
                                    transform: 'scaleY(.5)',
                                    animation: `lp-bar 2.6s ease-in-out ${b.d} infinite`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Brand panel (desktop) — follows the theme (dark↔light) so it
                stays cohesive with the form panel and the day/night scene. ──── */}
            <section className="relative hidden flex-col justify-between overflow-hidden border-l border-border bg-canvas p-10 text-text-1 lg:flex lg:flex-1">
                {/* Drifting dot grid. */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'radial-gradient(currentColor 1.1px, transparent 1.1px)',
                        backgroundSize: '24px 24px',
                        animation: 'lp-drift 60s linear infinite',
                    }}
                    aria-hidden="true"
                />

                {/* Brand lockup — the panel now follows the theme, so the shared
                    Logo (bg-primary box) reads correctly on it. */}
                <div
                    className="relative"
                    style={{ animation: 'lp-rise .6s ease .3s both' }}
                >
                    <Logo />
                </div>

                {/* Greeting + storefront scene. */}
                <div className="relative grid flex-1 place-items-center py-4">
                    <div
                        className="w-full max-w-[372px]"
                        style={{ animation: 'lp-rise .8s cubic-bezier(.22,1,.36,1) .42s both' }}
                    >
                        <div className="mb-3 ml-2 font-display text-[28px] font-semibold leading-tight tracking-[-0.012em] text-text-1">
                            {greetingForNow()}
                        </div>
                        <AuthBrandScene />
                    </div>
                </div>

                {/* Tagline. */}
                <div className="relative">
                    <h2
                        className="max-w-[460px] font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.012em]"
                        style={{ animation: 'lp-clip .8s cubic-bezier(.22,1,.36,1) .72s both' }}
                    >
                        The calmest way to run your shop.
                    </h2>
                    <p
                        className="mt-4 text-[13px] tracking-[0.02em] text-text-3"
                        style={{ animation: 'lp-rise .6s ease .86s both' }}
                    >
                        POS · Inventory · Accounting
                    </p>
                </div>
            </section>
        </div>
    );
}
