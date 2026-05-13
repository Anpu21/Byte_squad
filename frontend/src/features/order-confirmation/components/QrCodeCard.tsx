import { Download } from 'lucide-react';

interface QrCodeCardProps {
    qrDataUrl: string | null;
    orderCode: string;
}

export function QrCodeCard({ qrDataUrl, orderCode }: QrCodeCardProps) {
    return (
        <div className="bg-primary rounded-md p-6 flex flex-col items-center">
            {qrDataUrl ? (
                <img
                    src={qrDataUrl}
                    alt={`QR code for order ${orderCode}`}
                    className="w-60 h-60"
                />
            ) : (
                <div className="w-60 h-60 flex items-center justify-center text-xs text-text-2">
                    Generating QR…
                </div>
            )}
            <p className="mt-4 text-xs uppercase tracking-widest text-text-3">
                Code
            </p>
            <p className="font-mono text-lg font-bold text-text-inv mt-1">
                {orderCode}
            </p>
            {qrDataUrl && (
                <a
                    href={qrDataUrl}
                    download={`${orderCode}.png`}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-surface text-text-1 border border-border rounded-lg hover:bg-surface-2 transition-colors"
                >
                    <Download size={14} /> Download PNG
                </a>
            )}
        </div>
    );
}
