import { Download } from 'lucide-react';

interface ShopRequestQrPanelProps {
    qrSrc: string | null;
    requestCode: string;
}

export function ShopRequestQrPanel({
    qrSrc,
    requestCode,
}: ShopRequestQrPanelProps) {
    return (
        <div className="bg-primary rounded-md p-5 flex flex-col items-center">
            {qrSrc ? (
                <img
                    src={qrSrc}
                    alt={`QR code for request ${requestCode}`}
                    className="w-48 h-48 bg-surface rounded-md"
                />
            ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-text-inv/70">
                    Generating QR…
                </div>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-widest text-text-inv/70">
                Code
            </p>
            <p className="font-mono text-base font-bold text-text-inv mt-0.5">
                {requestCode}
            </p>
            {qrSrc && (
                <a
                    href={qrSrc}
                    download={`${requestCode}.png`}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-surface text-text-1 border border-border rounded-md hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <Download size={12} /> Download QR
                </a>
            )}
        </div>
    );
}
