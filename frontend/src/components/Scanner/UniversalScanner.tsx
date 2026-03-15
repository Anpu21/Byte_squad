import { useEffect, useRef, useState } from 'react';
// 1. Change the import to ONLY use @zxing/browser
import { BrowserMultiFormatReader } from '@zxing/browser';

interface UniversalScannerProps {
    onScanSuccess?: (text: string) => void;
}

export default function UniversalScanner({ onScanSuccess }: UniversalScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        if (!videoRef.current || !isScanning) return;

        const codeReader = new BrowserMultiFormatReader();
        let isMounted = true;

        codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (!isMounted) return;

            if (result) {
                const text = result.getText();
                setLastResult(text);
                if (onScanSuccess) onScanSuccess(text);

                setIsScanning(false);
                setTimeout(() => setIsScanning(true), 2000);
            }

            if (err) {
                // 2. Use err.name instead of importing and checking instanceof NotFoundException
                // This bypasses the TS module resolution issue completely.
                if (err.name !== 'NotFoundException') {
                    console.error('Barcode scanning error:', err);
                }
            }
        }).catch((err) => {
            console.error('Camera initialization failed:', err);
        });

        return () => {
            isMounted = false;
            // Modern cleanup for @zxing/browser
            const stream = videoRef.current?.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isScanning, onScanSuccess]);

    return (
        <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-700">
            
            <style>{`
                @keyframes scan-sweep {
                    0% { transform: translateY(-100%); }
                    50% { transform: translateY(100%); }
                    100% { transform: translateY(-100%); }
                }
                .animate-scan-sweep {
                    animation: scan-sweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>

            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm tracking-tight">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    Camera Scanner
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        {isScanning ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                        )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        {isScanning ? 'Active' : 'Paused'}
                    </span>
                </div>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
                
                <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    muted // Good practice for mobile browsers to allow autoplay
                    playsInline // Critical for iOS Safari
                />

                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

                <div className="relative w-2/3 max-w-[280px] aspect-[4/3] z-10">
                    <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] rounded-xl"></div>
                    
                    <svg className="absolute inset-0 w-full h-full text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0,20 L 0,0 L 20,0" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path d="M 80,0 L 100,0 L 100,20" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path d="M 0,80 L 0,100 L 20,100" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path d="M 100,80 L 100,100 L 80,100" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>

                    {isScanning && (
                        <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.6)] animate-scan-sweep"></div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.02] flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        Last Scan
                    </span>
                    {lastResult ? (
                        <span className="text-sm font-bold text-white tracking-wide font-mono">
                            {lastResult}
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-slate-400 italic">
                            Awaiting input...
                        </span>
                    )}
                </div>
                
                {lastResult && (
                    <button 
                        onClick={() => setLastResult(null)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                        title="Clear Result"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}