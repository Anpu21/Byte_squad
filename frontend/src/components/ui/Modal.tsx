import { type ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    /** Allows overriding the default width for different use cases (e.g., 'sm', 'md', 'lg', 'xl') */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export default function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children,
    maxWidth = 'lg' 
}: ModalProps) {
    
    // Handle Escape key and Body Scroll Lock
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Lock body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll if modal closes
            document.body.style.overflow = 'unset';
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            // Cleanup on unmount
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div 
                className={`relative w-full ${maxWidthMap[maxWidth]} bg-[#111111] border border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-[0.98] duration-200`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/[0.02] shrink-0 rounded-t-2xl">
                    <h2 id="modal-title" className="text-lg font-bold text-white tracking-tight">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-[3px] focus:ring-white/20"
                        aria-label="Close modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content Area - Scrollable if content exceeds viewport */}
                <div className="p-5 sm:p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}