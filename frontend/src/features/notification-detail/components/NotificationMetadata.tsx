interface NotificationMetadataProps {
    metadata: Record<string, unknown>;
}

function humanizeKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
}

function renderValue(value: unknown): string {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

export function NotificationMetadata({ metadata }: NotificationMetadataProps) {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return null;

    return (
        <div className="mt-8 pt-6 border-t border-border">
            <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                Additional Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {entries.map(([key, value]) => (
                    <div key={key} className="min-w-0">
                        <dt className="text-[11px] text-text-3 font-medium capitalize">
                            {humanizeKey(key)}
                        </dt>
                        <dd className="text-sm text-text-1 mt-0.5 break-words">
                            {renderValue(value)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
