import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface AvatarCardProps {
    displayName: string;
    email: string | undefined;
    avatarSrc: string | undefined;
    isUploading: boolean;
    onUpload: (file: File) => void;
}

export function AvatarCard({
    displayName,
    email,
    avatarSrc,
    isUploading,
    onUpload,
}: AvatarCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pick = () => fileInputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onUpload(file);
        e.target.value = '';
    };

    return (
        <aside className="lg:sticky lg:top-24 self-start">
            <div className="bg-surface border border-border rounded-md p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <Avatar
                        name={displayName}
                        src={avatarSrc}
                        size={120}
                        className="ring-4 ring-surface-2"
                    />
                    <button
                        type="button"
                        onClick={pick}
                        disabled={isUploading}
                        className="absolute bottom-1 right-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-text-inv border-2 border-surface shadow-md-token hover:bg-primary-hover transition-colors disabled:opacity-60"
                        aria-label="Change avatar"
                    >
                        {isUploading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Camera size={14} />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        aria-label="Upload avatar image"
                        className="hidden"
                        onChange={handleChange}
                    />
                </div>
                <p className="text-base font-semibold text-text-1 truncate max-w-full">
                    {displayName}
                </p>
                <p className="text-xs text-text-2 mt-1 truncate max-w-full">
                    {email}
                </p>
                <button
                    type="button"
                    onClick={pick}
                    disabled={isUploading}
                    className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors disabled:opacity-60"
                >
                    <Camera size={12} />
                    Upload photo
                </button>
                <p className="mt-2 text-[10.5px] text-text-3">
                    JPG, PNG or WebP · max 2MB
                </p>
            </div>
        </aside>
    );
}
