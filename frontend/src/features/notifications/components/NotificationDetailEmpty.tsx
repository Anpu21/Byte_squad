import { Bell } from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';

export function NotificationDetailEmpty() {
    return (
        <Card>
            <CardContent className="p-10">
                <div className="flex flex-col items-center justify-center py-16 text-text-3">
                    <Bell size={40} className="opacity-40 mb-4" />
                    <p className="text-sm font-medium text-text-2">
                        Select a notification to view details
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
