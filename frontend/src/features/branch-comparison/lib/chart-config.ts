import { LuBadgePercent as BadgePercent, LuChartColumnBig as BarChart3, LuBoxes as Boxes, LuCreditCard as CreditCard, LuPackage as Package, LuReceiptText as ReceiptText, LuShoppingBag as ShoppingBag, LuUsersRound as UsersRound } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';
import type { ComparisonView } from "./format";

export interface ViewOption {
  value: ComparisonView;
  label: string;
  Icon: LucideIcon;
}

export const VIEW_OPTIONS: ViewOption[] = [
  { value: "summary", label: "Summary", Icon: BarChart3 },
  { value: "sales", label: "Sales", Icon: ReceiptText },
  { value: "products", label: "Products", Icon: Package },
  { value: "inventory", label: "Inventory", Icon: Boxes },
  { value: "loyalty", label: "Loyalty", Icon: BadgePercent },
  { value: "customers", label: "Customers", Icon: ShoppingBag },
  { value: "payments", label: "Payments", Icon: CreditCard },
  { value: "staff", label: "Staff", Icon: UsersRound },
];

// Canonical categorical palette now lives with the chart primitives so the
// donut/multi-line charts and the branch-comparison charts share one source.
export { CHART_COLORS } from "@/components/charts/chart-palette";
