import type { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex bg-canvas text-text-1 font-sans overflow-hidden">
            <div className="flex-1 lg:flex-[0.6] flex items-center justify-center px-5 py-10 lg:p-10 bg-surface relative">
                <div className="absolute top-4 right-4 z-10">
                    <ThemeToggle />
                </div>
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </div>

            <div
                className="hidden lg:flex lg:flex-[0.4] flex-col justify-between p-10 relative overflow-hidden"
                style={{
                    background: 'var(--primary)',
                    color: 'var(--text-inv)',
                }}
            >
                <Logo />

                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <svg
                    viewBox="0 0 400 500"
                    className="self-center w-full max-w-[320px] opacity-70 relative"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                >
                    <path d="M80 80h240v360l-30-20-30 20-30-20-30 20-30-20-30 20-30-20-30 20Z" />
                    <line x1="120" y1="140" x2="280" y2="140" />
                    <line x1="120" y1="180" x2="240" y2="180" />
                    <line x1="120" y1="220" x2="280" y2="220" />
                    <line x1="120" y1="260" x2="200" y2="260" />
                    <line
                        x1="120"
                        y1="320"
                        x2="280"
                        y2="320"
                        strokeDasharray="2 4"
                    />
                    <text
                        x="120"
                        y="370"
                        fill="currentColor"
                        fontSize="20"
                        fontFamily="Geist Mono"
                        opacity="0.9"
                    >
                        TOTAL  4,250
                    </text>
                </svg>

                <div className="relative">
                    <p className="text-[22px] font-semibold leading-snug max-w-[320px]">
                        The calmest way to run your shop.
                    </p>
                    <p
                        className="text-xs mt-2"
                        style={{ color: 'var(--brand-300)' }}
                    >
                        POS · Inventory · Accounting
                    </p>
                </div>
            </div>
        </div>
    );
}
