import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #0a0a1a 0%, #0f0f23 40%, #12102e 100%)' }}
        >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute rounded-full"
                    style={{
                        width: '500px',
                        height: '500px',
                        background:
                            'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0.1) 40%, transparent 70%)',
                        filter: 'blur(80px)',
                        top: '-15%',
                        right: '-8%',
                        animation: 'float 8s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        width: '600px',
                        height: '600px',
                        background:
                            'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)',
                        filter: 'blur(80px)',
                        bottom: '-20%',
                        left: '-12%',
                        animation: 'float 10s ease-in-out infinite reverse',
                    }}
                />
                <div
                    className="absolute rounded-full"
                    style={{
                        width: '250px',
                        height: '250px',
                        background:
                            'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        top: '50%',
                        left: '60%',
                        animation: 'float 6s ease-in-out infinite 2s',
                    }}
                />

                {/* Subtle grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            {/* Content */}
            <div
                className="relative z-10 w-full px-5"
                style={{
                    maxWidth: '440px',
                    animation: 'fadeInUp 0.5s ease-out',
                }}
            >
                {/* Logo / Branding */}
                <div className="text-center" style={{ marginBottom: '36px' }}>
                    <div
                        className="inline-flex items-center justify-center rounded-2xl"
                        style={{
                            width: '60px',
                            height: '60px',
                            marginBottom: '20px',
                            background:
                                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                            boxShadow:
                                '0 10px 40px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                            <path d="M8 7h8" />
                            <path d="M8 11h8" />
                            <path d="M8 15h5" />
                        </svg>
                    </div>
                    <h1
                        className="font-bold"
                        style={{
                            fontSize: '32px',
                            letterSpacing: '-0.5px',
                            lineHeight: '1',
                            background:
                                'linear-gradient(135deg, #e0e7ff 0%, #a78bfa 50%, #c084fc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        LedgerPro
                    </h1>
                    <p
                        style={{
                            color: '#64748b',
                            fontSize: '13px',
                            marginTop: '8px',
                            fontWeight: 500,
                            letterSpacing: '0.5px',
                        }}
                    >
                        Modern Accounting & Point of Sale
                    </p>
                </div>

                {/* Glass Card */}
                <div
                    className="rounded-2xl"
                    style={{
                        padding: '36px 32px',
                        background:
                            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow:
                            '0 25px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                <p
                    className="text-center"
                    style={{
                        fontSize: '11px',
                        color: '#475569',
                        marginTop: '32px',
                    }}
                >
                    © 2026 LedgerPro. All rights reserved.
                </p>
            </div>
        </div>
    );
}
