import { NavLink } from "react-router-dom";
import { FRONTEND_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const TABS = [
  { to: FRONTEND_ROUTES.CUSTOMERS, label: "Directory" },
  { to: FRONTEND_ROUTES.CUSTOMER_INSIGHTS, label: "Insights" },
];

/** Directory ⇄ Insights switch shared by both customer-hub pages. */
export function CustomersViewTabs() {
  return (
    <nav className="mb-5 flex gap-1 border-b border-border">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors",
              isActive
                ? "border-primary text-text-1"
                : "border-transparent text-text-3 hover:text-text-1",
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
