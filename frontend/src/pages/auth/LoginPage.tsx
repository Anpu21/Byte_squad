import { useState, type FormEvent } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // TODO: integrate with auth API
        setTimeout(() => setIsLoading(false), 1500);
    };

    return (
        <>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2
                    style={{
                        fontSize: '22px',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        lineHeight: 1.2,
                    }}
                >
                    Welcome back
                </h2>
                <p
                    style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginTop: '6px',
                    }}
                >
                    Sign in to your account to continue
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div style={{ marginBottom: '22px' }}>
                    <label
                        htmlFor="login-email"
                        style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#94a3b8',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#475569',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <rect
                                    x="2"
                                    y="4"
                                    width="20"
                                    height="16"
                                    rx="3"
                                />
                                <path d="m2 7 10 6 10-6" />
                            </svg>
                        </div>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@company.com"
                            style={{
                                width: '100%',
                                height: '48px',
                                paddingLeft: '42px',
                                paddingRight: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Password field */}
                <div style={{ marginBottom: '28px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                        }}
                    >
                        <label
                            htmlFor="login-password"
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            Password
                        </label>
                        <button
                            type="button"
                            style={{
                                fontSize: '12px',
                                color: '#818cf8',
                                fontWeight: 500,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#475569',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="3"
                                />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            style={{
                                width: '100%',
                                height: '48px',
                                paddingLeft: '42px',
                                paddingRight: '48px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#475569',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                        >
                            {showPassword ? (
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        height: '50px',
                        borderRadius: '12px',
                        border: 'none',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.75 : 1,
                        background:
                            'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)',
                        boxShadow:
                            '0 6px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                                '0 10px 36px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow =
                            '0 6px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    }}
                >
                    {isLoading ? (
                        <>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{ animation: 'spin 1s linear infinite' }}
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M12 2a10 10 0 0 1 10 10"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign In
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    margin: '28px 0',
                }}
            >
                <div
                    style={{
                        flex: 1,
                        height: '1px',
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    }}
                />
                <span
                    style={{
                        fontSize: '11px',
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        fontWeight: 600,
                    }}
                >
                    or
                </span>
                <div
                    style={{
                        flex: 1,
                        height: '1px',
                        background:
                            'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    }}
                />
            </div>

            {/* Request access */}
            <p
                style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#64748b',
                }}
            >
                Don&apos;t have an account?{' '}
                <button
                    type="button"
                    style={{
                        color: '#818cf8',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
                >
                    Request access
                </button>
            </p>
        </>
    );
}
