// Design-system primitives. Import from '@/components/ui' — this barrel is the
// import contract for the app's shared UI layer (mirrors the '@/types' rule).

// Actions & inputs
export { default as Button } from './Button';
export { default as Input, type InputProps } from './Input';
export { Select, type SelectOption } from './Select';
export { default as Segmented } from './Segmented';
export { default as Stepper } from './Stepper';

// Surfaces
export {
    default as Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from './Card';
export { default as Modal } from './Modal';
export { default as ConfirmDialog, type ConfirmOptions } from './ConfirmDialog';
export { default as PageHeader } from './PageHeader';
export { default as Toolbar } from './Toolbar';
export { default as FilterBar } from './FilterBar';

// Data display
export {
    default as Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeaderCell,
    TableCell,
    type CellAlign,
} from './Table';
export {
    default as DataTable,
    type DataTableColumn,
    type SortState,
} from './DataTable';
export { default as Pagination } from './Pagination';
export { default as KpiCard } from './KpiCard';
export { default as Spark } from './Spark';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton, SkeletonText } from './Skeleton';

// Status & identity
export { default as Pill, type PillTone } from './Pill';
export { default as StatusPill } from './StatusPill';
export { default as Avatar } from './Avatar';
export { default as Logo } from './Logo';

// Navigation & chrome
export { ICON, NAV_ICON } from './icon-sizes';
export { Tabs, type TabItem } from './Tabs';
export { WorkspacePage } from './WorkspacePage';
export { default as Tooltip } from './Tooltip';
export { default as CommandPalette } from './CommandPalette';
export { default as ThemeToggle } from './ThemeToggle';
export { default as LanguageSwitcher } from './LanguageSwitcher';
export { AppBootSpinner } from './AppBootSpinner';
