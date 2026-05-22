export function AdminGlobalScopeCard() {
    return (
        <div className="bg-surface border border-border rounded-md p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-3">
                Scope
            </h3>
            <div className="flex items-start gap-3">
                <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"
                    aria-hidden="true"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                </span>
                <div>
                    <p className="text-sm font-semibold text-text-1">
                        System administrator
                    </p>
                    <p className="text-[12px] text-text-2 mt-0.5 leading-snug">
                        You manage every branch and every manager
                    </p>
                </div>
            </div>
        </div>
    );
}
