import { Lightbulb } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const TIPS = [
    'Allow camera permissions when prompted by the browser.',
    'Hold the QR code about 15–25 cm away from the lens.',
    'Ensure even lighting — avoid glare or strong backlighting.',
];

export function ScanTipsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                    <Lightbulb size={14} className="text-warning" />
                    Tips
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2.5 text-sm text-text-2">
                    {TIPS.map((tip) => (
                        <li key={tip} className="flex gap-2">
                            <span className="text-text-3">•</span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
