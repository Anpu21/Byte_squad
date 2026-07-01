import { useState } from 'react';
import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    StarRating,
    FIELD_SHELL,
    FIELD_BORDER,
    type DataTableColumn,
    type PillTone,
} from '@/components/ui';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useConfirm } from '@/hooks/useConfirm';
import { useReviewModeration } from '@/features/product-reviews/hooks/useReviewModeration';
import type { IModerationReview, ReviewStatus } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;
const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const statusTone: Record<ReviewStatus, PillTone> = {
    visible: 'success',
    hidden: 'neutral',
};

/**
 * Staff moderation for product reviews. Hide drops a review from the public
 * list + the product's rating (the author can't re-post over it); delete
 * removes it permanently. ADMIN / MANAGER only.
 */
export function ReviewModerationPage() {
    const [status, setStatus] = useState<'' | ReviewStatus>('');
    const [page, setPage] = useState(0);
    const filters = {
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
    };
    const { list, hide, unhide, remove } = useReviewModeration(filters);
    const confirm = useConfirm();

    const rows = list.data?.rows ?? [];
    const total = list.data?.total ?? 0;

    const onHide = async (r: IModerationReview) => {
        const ok = await confirm({
            title: 'Hide this review?',
            body: `Removes it from “${r.productName}” and its rating average. The author can't re-post over it.`,
            confirmLabel: 'Hide',
        });
        if (ok) hide.mutate({ reviewId: r.id });
    };
    const onDelete = async (r: IModerationReview) => {
        const ok = await confirm({
            title: 'Delete this review?',
            body: 'This permanently removes the review.',
            confirmLabel: 'Delete',
            tone: 'danger',
        });
        if (ok) remove.mutate(r.id);
    };

    const columns: DataTableColumn<IModerationReview>[] = [
        {
            key: 'product',
            header: 'Product',
            className: 'text-[13px] text-text-1 max-w-[200px] truncate',
            render: (r) => r.productName,
        },
        {
            key: 'rating',
            header: 'Rating',
            render: (r) => <StarRating value={r.rating} size={13} />,
        },
        {
            key: 'review',
            header: 'Review',
            className: 'max-w-[340px]',
            render: (r) => (
                <div className="min-w-0">
                    {r.title && (
                        <p className="truncate text-[13px] font-medium text-text-1">
                            {r.title}
                        </p>
                    )}
                    {r.comment && (
                        <p className="truncate text-[12px] text-text-2">
                            {r.comment}
                        </p>
                    )}
                    <p className="text-[11px] text-text-3">{r.reviewerName}</p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => (
                <Pill tone={statusTone[r.status]} dot={false}>
                    {r.status}
                </Pill>
            ),
        },
        {
            key: 'when',
            header: 'When',
            className: 'text-[12px] text-text-2 whitespace-nowrap',
            render: (r) => new Date(r.createdAt).toLocaleDateString(),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (r) => (
                <div className="flex justify-end gap-1.5">
                    {r.status === 'visible' ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onHide(r)}
                            disabled={hide.isPending}
                        >
                            Hide
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => unhide.mutate(r.id)}
                            disabled={unhide.isPending}
                        >
                            Unhide
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(r)}
                        disabled={remove.isPending}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const pager =
        total > 0 ? (
            <Pagination
                page={page + 1}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={(next) => setPage(next - 1)}
                unit="reviews"
            />
        ) : undefined;

    return (
        <div>
            <PageHeader
                eyebrow="Storefront"
                title="Review moderation"
                subtitle="Hide or remove customer reviews. Hidden reviews drop out of the public list and the product's rating, but the author can't re-post over them."
            />
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                    <select
                        className={`${INPUT_CLASS} field-select`}
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value as '' | ReviewStatus);
                            setPage(0);
                        }}
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                    </select>
                    <span className="ml-auto text-xs tabular-nums text-text-3">
                        {total} review{total === 1 ? '' : 's'}
                    </span>
                </div>
                <DataTable
                    columns={columns}
                    rows={rows}
                    getRowKey={(r) => r.id}
                    isLoading={list.isLoading}
                    zebra
                    footer={pager}
                    empty={
                        <EmptyState
                            title="No reviews"
                            description="Customer reviews will appear here as they're posted."
                        />
                    }
                />
            </Card>
        </div>
    );
}
