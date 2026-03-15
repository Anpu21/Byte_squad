import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center relative bg-[#0a0a0a] overflow-hidden">
            
            {/* Subtle fading grid background for a professional technical feel */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '64px 64px',
                        // This mask makes the grid fade out perfectly toward the edges
                        maskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-[440px] px-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Logo / Branding */}
                <div className="text-center mb-9">
                    {/* Updated to a solid white block to match the new sign-in button */}
                    <div className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-2xl mb-5 bg-white shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0f172a" // Dark slate to match the new theme
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                            <path d="M8 7h8" />
                            <path d="M8 11h8" />
                            <path d="M8 15h5" />
                        </svg>
                    </div>
                    <h1 className="font-bold text-[32px] tracking-tight leading-none text-white">
                        LedgerPro
                    </h1>
                    <p className="text-slate-400 text-[13px] mt-2 font-medium tracking-wide">
                        Modern Accounting & Point of Sale
                    </p>
                </div>

                {/* Glass Card - Simplified for a cleaner dark mode look */}
                <div className="rounded-2xl py-9 px-8 bg-[#111111]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] text-slate-500 mt-8 font-medium tracking-wide">
                    © 2026 LedgerPro. All rights reserved.
                </p>
            </div>
        </div>
    );
}