export function NotificationDetailNotFound() {
    return (
        <div className="bg-surface border border-border rounded-md p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-surface-2 flex items-center justify-center mb-4">
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-3"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <p className="text-sm font-semibold text-text-1">
                Notification not found
            </p>
            <p className="text-xs text-text-3 mt-1">
                It may have been removed or you don&apos;t have access to it.
            </p>
        </div>
    );
}
