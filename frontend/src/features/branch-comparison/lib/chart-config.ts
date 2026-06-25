import { LuBadgePercent as BadgePercent, LuChartColumnBig as BarChart3, LuBoxes as Boxes, LuCreditCard as CreditCard, LuReceiptText as ReceiptText, LuShoppingBag as ShoppingBag, LuUsersRound as UsersRound } from 'react-icons/lu';
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
  { value: "inventory", label: "Inventory", Icon: Boxes },
  { value: "loyalty", label: "Loyalty", Icon: BadgePercent },
  { value: "customers", label: "Customers", Icon: ShoppingBag },
  { value: "payments", label: "Payments", Icon: CreditCard },
  { value: "staff", label: "Staff", Icon: UsersRound },
];

export const CHART_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--warning)",
  "var(--info)",
  "var(--danger)",
  "var(--brand-400)",
];
