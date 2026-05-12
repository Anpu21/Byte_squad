import { Camera, Package, Scan } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function ScannerTipsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Scanner</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-2 space-y-2">
                <p className="flex items-start gap-2">
                    <Scan size={13} className="text-text-3 mt-0.5 flex-shrink-0" />
                    Use a USB barcode scanner — it auto-fills the barcode field.
                </p>
                <p className="flex items-start gap-2">
                    <Camera size={13} className="text-text-3 mt-0.5 flex-shrink-0" />
                    Or click the camera icon next to the Barcode input.
                </p>
                <p className="flex items-start gap-2">
                    <Package size={13} className="text-text-3 mt-0.5 flex-shrink-0" />
                    If the barcode matches a product, fields auto-fill on blur.
                </p>
            </CardContent>
        </Card>
    );
}
