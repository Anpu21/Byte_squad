import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { TransferStatus, UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import {
    stockTransfersService,
    type IStockTransferRequest,
    type ITransferSourceOption,
    type ITransferUserSummary,
} from '@/services/stock-transfers.service';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';

function fullName(user: ITransferUserSummary | null): string {
    if (!user) return '—';
    return `${user.firstName} ${user.lastName}`.trim();
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString();
}

interface AuditCardProps {
    label: string;
    user: ITransferUserSummary | null;
    timestamp: string | null;
}

function AuditCard({ label, user, timestamp }: AuditCardProps) {
    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {label}
            </p>
            <p className="text-sm text-slate-200 font-medium">
                {fullName(user)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
                {formatDateTime(timestamp)}
            </p>
        </div>
    );
}

export default function TransferDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [transfer, setTransfer] = useState<IStockTransferRequest | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeAction, setActiveAction] = useState<
        null | 'approve' | 'reject' | 'cancel' | 'ship' | 'receive'
    >(null);
    const [submitting, setSubmitting] = useState(false);

    // Approve modal state
    const [sourceOptions, setSourceOptions] = useState<
        ITransferSourceOption[]
    >([]);
    const [sourceLoading, setSourceLoading] = useState(false);
    const [chosenSourceId, setChosenSourceId] = useState<string>('');
    const [approvedQuantityStr, setApprovedQuantityStr] =
        useState<string>('');
    const [approvalNote, setApprovalNote] = useState('');

    // Reject modal state
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchTransfer = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await stockTransfersService.getById(id);
            setTransfer(result);
        } catch {
            setError('Could not load transfer details');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTransfer();
    }, [fetchTransfer]);

    const openApprove = async () => {
        if (!id || !transfer) return;
        setActiveAction('approve');
        setApprovedQuantityStr(String(transfer.requestedQuantity));
        setChosenSourceId('');
        setApprovalNote('');
        setSourceLoading(true);
        try {
            const opts = await stockTransfersService.getSourceOptions(id);
            setSourceOptions(opts);
        } catch {
            toast.error('Could not load source branch options');
        } finally {
            setSourceLoading(false);
        }
    };

    const closeModal = () => {
        if (submitting) return;
        setActiveAction(null);
        setRejectionReason('');
        setApprovalNote('');
    };

    const handleApproveSubmit = async () => {
        if (!id || !transfer) return;
        if (!chosenSourceId) {
            toast.error('Pick a source branch first');
            return;
        }
        const qty = parseInt(approvedQuantityStr, 10);
        if (Number.isNaN(qty) || qty < 1 || qty > transfer.requestedQuantity) {
            toast.error(
                `Approved quantity must be between 1 and ${transfer.requestedQuantity}`,
            );
            return;
        }
        setSubmitting(true);
        try {
            const trimmedNote = approvalNote.trim();
            await stockTransfersService.approve(id, {
                sourceBranchId: chosenSourceId,
                approvedQuantity: qty,
                approvalNote: trimmedNote ? trimmedNote : undefined,
            });
            toast.success('Transfer approved');
            setActiveAction(null);
            setApprovalNote('');
            fetchTransfer();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to approve transfer';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!id) return;
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason');
            return;
        }
        setSubmitting(true);
        try {
            await stockTransfersService.reject(id, rejectionReason.trim());
            toast.success('Transfer rejected');
            setActiveAction(null);
            setRejectionReason('');
            fetchTransfer();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to reject transfer';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSimpleAction = async (
        action: 'cancel' | 'ship' | 'receive',
    ) => {
        if (!id) return;
        setSubmitting(true);
        try {
            if (action === 'cancel') {
                await stockTransfersService.cancel(id);
                toast.success('Transfer cancelled');
            } else if (action === 'ship') {
                await stockTransfersService.ship(id);
                toast.success('Transfer marked as shipped');
            } else {
                await stockTransfersService.receive(id);
                toast.success('Transfer received');
            }
            setActiveAction(null);
            fetchTransfer();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : `Failed to ${action} transfer`;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-300">
                <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="h-6 w-64 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !transfer) {
        return (
            <div className="animate-in fade-in duration-300">
                <p className="text-sm text-slate-400">
                    {error ?? 'Transfer not found'}
                </p>
                <button
                    onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                    className="mt-4 h-9 px-4 rounded-lg border border-white/10 text-sm text-white hover:bg-white/5 transition-colors"
                >
                    Back to transfers
                </button>
            </div>
        );
    }

    const isAdmin = user?.role === UserRole.ADMIN;
    const isSourceManager =
        user?.role === UserRole.MANAGER &&
        transfer.sourceBranchId === user?.branchId;
    const isDestinationManager =
        user?.role === UserRole.MANAGER &&
        transfer.destinationBranchId === user?.branchId;

    const canApproveOrReject =
        isAdmin && transfer.status === TransferStatus.PENDING;
    const canCancel =
        isAdmin &&
        (transfer.status === TransferStatus.PENDING ||
            transfer.status === TransferStatus.APPROVED);
    const canShip =
        (isAdmin || isSourceManager) &&
        transfer.status === TransferStatus.APPROVED;
    const canReceive =
        (isAdmin || isDestinationManager) &&
        transfer.status === TransferStatus.IN_TRANSIT;

    const displayQty =
        transfer.approvedQuantity ?? transfer.requestedQuantity;

    return (
        <div className="animate-in fade-in duration-300 max-w-5xl">
            <div className="mb-6">
                <button
                    onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                    className="text-xs text-slate-500 hover:text-white transition-colors mb-3 flex items-center gap-1"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to transfers
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {transfer.product.name}
                            </h1>
                            <TransferStatusPill status={transfer.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            {displayQty} unit(s) ·{' '}
                            {transfer.sourceBranch?.name ?? 'No source yet'}{' '}
                            → {transfer.destinationBranch.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Audit timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <AuditCard
                    label="Requested by"
                    user={transfer.requestedBy}
                    timestamp={transfer.createdAt}
                />
                <AuditCard
                    label={
                        transfer.status === TransferStatus.REJECTED
                            ? 'Rejected by'
                            : transfer.status === TransferStatus.CANCELLED
                              ? 'Cancelled by'
                              : 'Reviewed by'
                    }
                    user={transfer.reviewedBy}
                    timestamp={transfer.reviewedAt}
                />
                <AuditCard
                    label="Shipped by"
                    user={transfer.shippedBy}
                    timestamp={transfer.shippedAt}
                />
                <AuditCard
                    label="Received by"
                    user={transfer.receivedBy}
                    timestamp={transfer.receivedAt}
                />
            </div>

            {/* Reasons */}
            {(transfer.requestReason ||
                transfer.rejectionReason ||
                transfer.approvalNote) && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
                    {transfer.requestReason && (
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                Request reason
                            </p>
                            <p className="text-sm text-slate-300">
                                {transfer.requestReason}
                            </p>
                        </div>
                    )}
                    {transfer.approvalNote && (
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 mb-1">
                                Admin verification message
                            </p>
                            <p className="text-sm text-slate-300">
                                {transfer.approvalNote}
                            </p>
                        </div>
                    )}
                    {transfer.rejectionReason && (
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-300 mb-1">
                                Rejection reason
                            </p>
                            <p className="text-sm text-slate-300">
                                {transfer.rejectionReason}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            {(canApproveOrReject || canCancel || canShip || canReceive) && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Actions
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        {canApproveOrReject && (
                            <>
                                <button
                                    onClick={openApprove}
                                    className="h-10 px-5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => setActiveAction('reject')}
                                    className="h-10 px-5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium hover:bg-rose-500/25 transition-colors"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        {canShip && (
                            <button
                                onClick={() => setActiveAction('ship')}
                                className="h-10 px-5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all"
                            >
                                Mark Shipped
                            </button>
                        )}
                        {canReceive && (
                            <button
                                onClick={() => setActiveAction('receive')}
                                className="h-10 px-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
                            >
                                Mark Received
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => setActiveAction('cancel')}
                                className="h-10 px-4 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel transfer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Approve modal */}
            {activeAction === 'approve' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Approve transfer
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Pick a source branch with enough stock and confirm
                            the quantity.
                        </p>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl max-h-72 overflow-y-auto mb-4">
                            {sourceLoading ? (
                                <div className="p-4 text-sm text-slate-500">
                                    Loading branches…
                                </div>
                            ) : sourceOptions.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500">
                                    No other branches found.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                            <th className="px-4 py-2 text-left font-semibold"></th>
                                            <th className="px-4 py-2 text-left font-semibold">
                                                Branch
                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold">
                                                Stock
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sourceOptions.map((opt) => {
                                            const requested =
                                                transfer.requestedQuantity;
                                            const sufficient =
                                                opt.currentQuantity >=
                                                requested;
                                            const disabled = !opt.isActive;
                                            const isChecked =
                                                chosenSourceId ===
                                                opt.branchId;
                                            return (
                                                <tr
                                                    key={opt.branchId}
                                                    className={`border-b border-white/5 transition-colors ${
                                                        disabled
                                                            ? 'opacity-50'
                                                            : 'hover:bg-white/[0.02] cursor-pointer'
                                                    } ${
                                                        isChecked
                                                            ? 'bg-white/[0.04]'
                                                            : ''
                                                    }`}
                                                    onClick={() => {
                                                        if (!disabled) {
                                                            setChosenSourceId(
                                                                opt.branchId,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <td className="px-4 py-3 w-10">
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                isChecked
                                                            }
                                                            onChange={() => {
                                                                if (
                                                                    !disabled
                                                                ) {
                                                                    setChosenSourceId(
                                                                        opt.branchId,
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                disabled
                                                            }
                                                            className="accent-white"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-200">
                                                        {opt.branchName}
                                                        {!opt.isActive && (
                                                            <span className="ml-2 text-[10px] text-slate-500">
                                                                (inactive)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-3 text-right tabular-nums font-medium ${
                                                            sufficient
                                                                ? 'text-emerald-300'
                                                                : 'text-amber-300'
                                                        }`}
                                                    >
                                                        {opt.currentQuantity}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Approved quantity
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={transfer.requestedQuantity}
                                value={approvedQuantityStr}
                                onChange={(e) =>
                                    setApprovedQuantityStr(e.target.value)
                                }
                                className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all"
                            />
                            <p className="text-[11px] text-slate-600 mt-1">
                                Requested: {transfer.requestedQuantity} unit(s)
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Verification message to managers (optional)
                            </label>
                            <textarea
                                value={approvalNote}
                                onChange={(e) =>
                                    setApprovalNote(e.target.value)
                                }
                                rows={2}
                                maxLength={500}
                                placeholder="e.g. Please ship before Friday — store running out."
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 resize-none"
                            />
                            <p className="text-[11px] text-slate-600 mt-1">
                                Sent to both source and destination branch
                                managers in the approval notification.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={submitting}
                                className="h-9 px-4 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveSubmit}
                                disabled={submitting || !chosenSourceId}
                                className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
                            >
                                {submitting
                                    ? 'Approving…'
                                    : 'Confirm approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject modal */}
            {activeAction === 'reject' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Reject transfer
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            The requesting branch will see this reason.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) =>
                                setRejectionReason(e.target.value)
                            }
                            rows={3}
                            maxLength={500}
                            placeholder="Reason for rejection…"
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600 resize-none"
                        />
                        <div className="flex items-center justify-end gap-3 mt-4">
                            <button
                                onClick={closeModal}
                                disabled={submitting}
                                className="h-9 px-4 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={submitting}
                                className="h-9 px-4 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Rejecting…' : 'Reject transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel / Ship / Receive confirmation modals */}
            {(activeAction === 'cancel' ||
                activeAction === 'ship' ||
                activeAction === 'receive') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {activeAction === 'cancel'
                                ? 'Cancel transfer'
                                : activeAction === 'ship'
                                  ? 'Mark transfer as shipped'
                                  : 'Mark transfer as received'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">
                            {activeAction === 'cancel'
                                ? 'This will void the transfer. No inventory will move.'
                                : activeAction === 'ship'
                                  ? `This will deduct ${displayQty} unit(s) of ${transfer.product.name} from ${transfer.sourceBranch?.name ?? 'source branch'}. Continue?`
                                  : `This will add ${displayQty} unit(s) of ${transfer.product.name} to ${transfer.destinationBranch.name}. Continue?`}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={submitting}
                                className="h-9 px-4 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={() =>
                                    handleSimpleAction(
                                        activeAction as
                                            | 'cancel'
                                            | 'ship'
                                            | 'receive',
                                    )
                                }
                                disabled={submitting}
                                className={`h-9 px-4 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
                                    activeAction === 'cancel'
                                        ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                                        : activeAction === 'receive'
                                          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                                          : 'bg-white text-slate-900 hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                                }`}
                            >
                                {submitting ? 'Working…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
