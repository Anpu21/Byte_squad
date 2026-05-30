import { useRef } from 'react';
import { UserCircle, Upload } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

interface EmployeePhotoCardProps {
    photoUrl: string | null;
    uploading: boolean;
    isEditMode: boolean;
    fullName: string;
    onFileSelected: (file: File) => void | Promise<void>;
}

/**
 * Photo upload card. The BE photo endpoint requires the employee to
 * exist, so on the create page we surface a soft message asking the
 * user to save first; the cashier already saw the same UX on the
 * product form.
 */
export function EmployeePhotoCard({
    photoUrl,
    uploading,
    isEditMode,
    fullName,
    onFileSelected,
}: EmployeePhotoCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                    <UserCircle size={14} />
                    Photo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="aspect-square w-full max-w-[200px] mx-auto rounded-md border border-border overflow-hidden bg-surface-2 flex items-center justify-center">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={fullName || 'Employee photo'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Avatar name={fullName || '?'} size={120} />
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label="Upload employee photo"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onFileSelected(file);
                        e.target.value = '';
                    }}
                />

                <Button
                    type="button"
                    variant={photoUrl ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !isEditMode}
                    className="w-full"
                >
                    <Upload size={13} />
                    {uploading
                        ? 'Uploading…'
                        : photoUrl
                          ? 'Replace photo'
                          : 'Upload photo'}
                </Button>

                <p className="text-[11px] text-text-3">
                    JPG, PNG, WebP or GIF · up to 2 MB.
                    {!isEditMode && ' Photo can be uploaded after the employee is created.'}
                </p>
            </CardContent>
        </Card>
    );
}
