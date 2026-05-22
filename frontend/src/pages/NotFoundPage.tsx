import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function NotFoundPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleReturnHome = () => {
        navigate(user ? FRONTEND_ROUTES.DASHBOARD : FRONTEND_ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative bg-canvas overflow-hidden selection:bg-primary-soft">

            {/* Subtle background grid (Matches AuthLayout) */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(120,130,140,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(120,130,140,0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '64px 64px',
                        maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
                    }}
                />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-[0.98] duration-1000">
                
                {/* Animated Graphic Element */}
                <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                    {/* Glowing Backdrop */}
                    <div className="absolute inset-0 bg-surface-2 blur-3xl rounded-full"></div>
                    
                    {/* Floating Abstract "Missing Document" */}
                    <div className="absolute animate-float-delayed text-text-3/20">
                        <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        </svg>
                    </div>

                    {/* Main "404" Floating Text */}
                    <h1 className="text-[120px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-text-1 to-text-1/10 animate-float leading-none">
                        404
                    </h1>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl font-bold text-text-1 tracking-tight mb-3">
                    Ledger Entry Not Found
                </h2>
                <p className="text-text-2 text-sm max-w-md mb-10 leading-relaxed">
                    The page or record you are looking for has been moved, deleted, or never existed in the database.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto h-11 px-6 rounded-xl border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Go Back
                    </button>
                    
                    {/* Smart Routing Button */}
                    <button
                        onClick={handleReturnHome}
                        className="w-full sm:w-auto h-11 px-8 rounded-xl bg-primary text-text-inv text-sm font-bold tracking-wide hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {user ? (
                                <>
                                    <rect x="3" y="3" width="7" height="9"></rect>
                                    <rect x="14" y="3" width="7" height="5"></rect>
                                    <rect x="14" y="12" width="7" height="9"></rect>
                                    <rect x="3" y="16" width="7" height="5"></rect>
                                </>
                            ) : (
                                <>
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                    <polyline points="10 17 15 12 10 7"></polyline>
                                    <line x1="15" y1="12" x2="3" y2="12"></line>
                                </>
                            )}
                        </svg>
                        {user ? 'Return to Dashboard' : 'Sign In to Continue'}
                    </button>
                </div>

            </div>
        </div>
    );
}