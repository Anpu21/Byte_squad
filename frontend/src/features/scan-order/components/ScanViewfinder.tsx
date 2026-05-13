import UniversalScanner from '@/components/Scanner/UniversalScanner';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';

interface ScanViewfinderProps {
    hasRequest: boolean;
    onScan: (text: string) => void;
}

export function ScanViewfinder({ hasRequest, onScan }: ScanViewfinderProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Viewfinder</CardTitle>
                {!hasRequest && (
                    <Pill tone="info">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
                            Scanning…
                        </span>
                    </Pill>
                )}
            </CardHeader>
            <CardContent className="p-4">
                <div className="relative">
                    <UniversalScanner onScanSuccess={onScan} />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="relative h-56 w-56 max-h-[60%] max-w-[60%]">
                            <span className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
                            <span className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
                            <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
                            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary rounded-br-md" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
