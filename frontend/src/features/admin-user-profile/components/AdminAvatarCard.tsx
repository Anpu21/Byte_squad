import { useRef } from 'react';
import type { IUserProfile } from '@/types';
import { RoleBadge } from './RoleBadge';

interface AdminAvatarCardProps {
    profile: IUserProfile | undefined;
    initials: string;
    onUploadAvatar: (file: File) => void;
}

export function AdminAvatarCard({
    profile,
    initials,
    onUploadAvatar,
}: AdminAvatarCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pick = () => fileInputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onUploadAvatar(file);
        e.target.value = '';
    };

    return (
        <div className="bg-surface border border-border rounded-md p-6 flex flex-col items-center text-center shadow-2xl">
            <div
                className="relative group cursor-pointer mb-5"
                onClick={pick}
            >
                <div className="w-24 h-24 rounded-full bg-surface-2 border border-border flex items-center justify-center text-2xl font-bold text-text-1 shadow-inner overflow-hidden transition-transform group-hover:scale-105 duration-300">
                    {profile?.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleChange}
                />
            </div>

            <h2 className="text-lg font-bold text-text-1 tracking-tight">
                {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-sm text-text-2 mb-4">{profile?.email}</p>

            {profile && <RoleBadge role={profile.role} />}
        </div>
    );
}
