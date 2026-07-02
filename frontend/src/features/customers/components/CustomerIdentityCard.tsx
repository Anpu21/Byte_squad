import Card from "@/components/ui/Card";
import { cn, formatCurrency } from "@/lib/utils";
import type { ICustomerProfileDetail } from "@/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-3">{label}</dt>
      <dd className="truncate font-medium text-text-1">{value}</dd>
    </div>
  );
}

export function CustomerIdentityCard({
  profile,
}: {
  profile: ICustomerProfileDetail;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-text-1">Contact</h3>
        <dl className="space-y-2 text-[13px]">
          <Row label="Phone" value={profile.phone ?? "—"} />
          <Row label="Email" value={profile.email ?? "—"} />
          <Row label="Home branch" value={profile.homeBranchName ?? "—"} />
        </dl>
      </Card>

      {profile.creditAccounts.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-text-1">
            Khata accounts
          </h3>
          <ul className="space-y-2.5">
            {profile.creditAccounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text-1">
                    {a.accountNo}
                  </span>
                  <span className="text-[11px] text-text-3">
                    {a.branchName ?? "—"} · {a.status}
                  </span>
                </span>
                <span
                  className={cn(
                    "mono font-semibold",
                    a.currentBalance > 0 ? "text-warning" : "text-text-2",
                  )}
                >
                  {formatCurrency(a.currentBalance)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
