import { Keyboard } from 'lucide-react';
import { type RefObject } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ManualCodeFormProps {
    manualCode: string;
    setManualCode: (v: string) => void;
    loading: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
}

export function ManualCodeForm({
    manualCode,
    setManualCode,
    loading,
    inputRef,
    onSubmit,
}: ManualCodeFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Or enter code manually</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-3">
                    <label className="text-[11px] uppercase tracking-widest text-text-3 flex items-center gap-2">
                        <Keyboard size={12} /> Manual / hardware scanner
                    </label>
                    <input
                        ref={inputRef}
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="ORD-XXXXXXXX"
                        className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm font-mono text-text-1 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25"
                    />
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Looking up…' : 'Look up'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
