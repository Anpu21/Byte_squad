import { LuKeyboard as Keyboard } from 'react-icons/lu';
import { type RefObject } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

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
                        className={`${FIELD_SHELL} ${FIELD_BORDER} w-full px-3 py-2 font-mono`}
                    />
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Looking up…' : 'Look up'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
