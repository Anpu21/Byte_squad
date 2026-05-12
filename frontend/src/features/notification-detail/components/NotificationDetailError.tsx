interface NotificationDetailErrorProps {
    message: string;
    onRetry: () => void;
}

export function NotificationDetailError({
    message,
    onRetry,
}: NotificationDetailErrorProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-10 text-center">
            <p className="text-sm font-semibold text-text-1">{message}</p>
            <button
                onClick={onRetry}
                className="mt-4 text-[13px] font-medium text-text-2 hover:text-text-1 px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
