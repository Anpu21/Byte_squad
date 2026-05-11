import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '@/services/api';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { INotification } from '@/types/index';
import {
    typeLabel,
    typeBadgeColor,
} from '@/components/notifications/notificationUtils';
import NotificationIcon from '@/components/notifications/NotificationIcon';

type LoadState =
    | { status: 'loading' }
    | { status: 'ready'; notification: INotification }
    | { status: 'not_found' }
    | { status: 'error'; message: string };

function formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    });
}

function MetadataView({ metadata }: { metadata: Record<string, unknown> }) {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return null;

    return (
        <div className="mt-8 pt-6 border-t border-border">
            <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                Additional Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {entries.map(([key, value]) => (
                    <div key={key} className="min-w-0">
                        <dt className="text-[11px] text-text-3 font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-sm text-text-1 mt-0.5 break-words">
                            {typeof value === 'object' && value !== null
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function NotificationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [fetchState, setFetchState] = useState<LoadState>({
        status: 'loading',
    });

    useEffect(() => {
        if (!id) return;

        let active = true;

        api.get<{ data: INotification }>(`/notifications/${id}`)
            .then(async (response) => {
                if (!active) return;
                const notification = response.data.data;
                setFetchState({ status: 'ready', notification });

                if (!notification.isRead) {
                    try {
                        await api.patch(`/notifications/${id}/read`);
                    } catch {
                        // Non-critical: read receipt failed, view still works
                    }
                }
            })
            .catch((err: unknown) => {
                if (!active) return;
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setFetchState({ status: 'not_found' });
                } else {
                    setFetchState({
                        status: 'error',
                        message: 'Could not load this notification.',
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [id]);

    const state: LoadState = !id ? { status: 'not_found' } : fetchState;

    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            {/* Back link */}
            <button
                onClick={() => navigate(FRONTEND_ROUTES.NOTIFICATIONS)}
                className="flex items-center gap-2 text-[13px] font-medium text-text-2 hover:text-text-1 mb-6 transition-colors"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to notifications
            </button>

            {state.status === 'loading' && (
                <div className="bg-surface border border-border rounded-md p-10">
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-surface-2" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-2 rounded w-2/3" />
                            <div className="h-3 bg-surface-2 rounded w-1/3" />
                        </div>
                    </div>
                    <div className="mt-8 space-y-3 animate-pulse">
                        <div className="h-3 bg-surface-2 rounded w-full" />
                        <div className="h-3 bg-surface-2 rounded w-11/12" />
                        <div className="h-3 bg-surface-2 rounded w-9/12" />
                    </div>
                </div>
            )}

            {state.status === 'not_found' && (
                <div className="bg-surface border border-border rounded-md p-10 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-surface-2 flex items-center justify-center mb-4">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-text-3"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text-1">
                        Notification not found
                    </p>
                    <p className="text-xs text-text-3 mt-1">
                        It may have been removed or you don&apos;t have access
                        to it.
                    </p>
                </div>
            )}

            {state.status === 'error' && (
                <div className="bg-surface border border-border rounded-md p-10 text-center">
                    <p className="text-sm font-semibold text-text-1">
                        {state.message}
                    </p>
                    <button
                        onClick={() => navigate(0)}
                        className="mt-4 text-[13px] font-medium text-text-2 hover:text-text-1 px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            )}

            {state.status === 'ready' && (
                <article className="bg-surface border border-border rounded-md overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-border">
                        <div className="flex items-start gap-4">
                            <NotificationIcon type={state.notification.type} />
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span
                                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${typeBadgeColor(
                                            state.notification.type,
                                        )}`}
                                    >
                                        {typeLabel(state.notification.type)}
                                    </span>
                                    {state.notification.isRead ? (
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-surface-2 text-text-3 border-border">
                                            Read
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-primary-soft text-text-1 border-border">
                                            New
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-xl font-bold text-text-1 tracking-tight leading-snug">
                                    {state.notification.title}
                                </h1>
                                <p className="text-[12px] text-text-3 mt-2">
                                    {formatFullDate(
                                        state.notification.createdAt,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                            Message
                        </h2>
                        <p className="text-[15px] text-text-1 leading-relaxed whitespace-pre-wrap break-words">
                            {state.notification.message}
                        </p>

                        <MetadataView metadata={state.notification.metadata} />
                    </div>
                </article>
            )}
        </div>
    );
}
