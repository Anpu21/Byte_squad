import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuCheck as Check } from "react-icons/lu";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { FRONTEND_ROUTES } from "@/constants/routes";
import { customerService } from "@/services/customers.service";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import type { ICustomerProfileDetail, ICustomerSummaryRow } from "@/types";

function apiMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const data = (err as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;
    if (typeof data === "string") return data;
  }
  return fallback;
}

/**
 * Merge a walk-in / khata customer into a registered account. Searches
 * registered customers, then folds the source's sales, points, and khata onto
 * the chosen target (irreversible; admin-only, enforced by the API).
 */
export function CustomerMergeModal({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source: ICustomerProfileDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<ICustomerSummaryRow | null>(null);

  const canSearch = isOpen && search.trim().length >= 2;
  const results = useQuery({
    queryKey: queryKeys.customers.list({ mergeSearch: search.trim() }),
    queryFn: () =>
      customerService.list({
        type: "registered",
        search: search.trim(),
        page: 1,
        limit: 8,
      }),
    enabled: canSearch,
  });

  const mutation = useMutation({
    mutationFn: (targetKey: string) =>
      customerService.merge(source.customerKey, targetKey),
    onSuccess: (_data, targetKey) => {
      toast.success("Customer merged");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
      navigate(
        FRONTEND_ROUTES.CUSTOMER_DETAIL.replace(
          ":key",
          encodeURIComponent(targetKey),
        ),
      );
    },
    onError: (err) => toast.error(apiMessage(err, "Couldn’t merge this customer")),
  });

  const candidates = (results.data?.items ?? []).filter(
    (r) => r.customerKey !== source.customerKey,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge into registered customer"
      maxWidth="lg"
      closeOnBackdrop={false}
    >
      <div className="space-y-4">
        <p className="text-[13px] text-text-3">
          Move{" "}
          <span className="font-medium text-text-1">{source.displayName}</span>
          ’s sales, loyalty points, and khata onto a registered account. This
          can’t be undone.
        </p>

        <Input
          label="Search registered customers"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setTarget(null);
          }}
          placeholder="Name, phone, or email"
        />

        <div className="max-h-64 overflow-auto rounded-md border border-border">
          {!canSearch ? (
            <p className="p-4 text-[12.5px] text-text-3">
              Type at least 2 characters to search.
            </p>
          ) : results.isLoading ? (
            <p className="p-4 text-[12.5px] text-text-3">Searching…</p>
          ) : candidates.length === 0 ? (
            <p className="p-4 text-[12.5px] text-text-3">
              No registered customers found.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((r) => (
                <li key={r.customerKey}>
                  <button
                    type="button"
                    onClick={() => setTarget(r)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-surface-2",
                      target?.customerKey === r.customerKey && "bg-focus-soft",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text-1">
                        {r.displayName}
                      </span>
                      <span className="text-[11px] text-text-3">
                        {r.phone ?? "—"}
                      </span>
                    </span>
                    {target?.customerKey === r.customerKey && (
                      <Check size={15} className="shrink-0 text-focus" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!target || mutation.isPending}
            onClick={() => target && mutation.mutate(target.customerKey)}
          >
            {mutation.isPending
              ? "Merging…"
              : target
                ? `Merge into ${target.displayName}`
                : "Select a customer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
