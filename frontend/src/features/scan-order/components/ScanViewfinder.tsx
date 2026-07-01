import UniversalScanner from '@/components/Scanner/UniversalScanner';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ScanViewfinderProps {
    onScan: (text: string) => void;
}

/**
 * Camera viewfinder card. `UniversalScanner` owns all the scan chrome
 * (status badge, corner brackets, sweep line, last-scan footer), so this
 * wrapper only supplies the card frame — no duplicated overlay.
 */
export function ScanViewfinder({ onScan }: ScanViewfinderProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Viewfinder</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <UniversalScanner onScanSuccess={onScan} />
            </CardContent>
        </Card>
    );
}
