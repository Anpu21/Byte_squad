#!/usr/bin/env node
// One-shot script to migrate hardcoded dark Tailwind literals to design tokens.
// Run from the `frontend` directory: `node scripts/migrate-tokens.mjs`
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const REPLACEMENTS = [
    // background canvases
    [/bg-\[#0a0a0a\]/g, 'bg-canvas'],
    [/bg-\[#111111\]/g, 'bg-surface'],
    [/bg-\[#161616\]/g, 'bg-surface-2'],
    [/bg-\[#1a1a1a\]/g, 'bg-surface-2'],
    [/bg-\[#0f0f0f\]/g, 'bg-canvas'],
    [/bg-\[#171717\]/g, 'bg-surface'],

    // borders
    [/border-white\/10/g, 'border-border'],
    [/border-white\/5/g, 'border-border'],
    [/border-white\/20/g, 'border-border-strong'],
    [/border-white\/30/g, 'border-primary/40'],
    [/border-white\/15/g, 'border-border-strong'],

    // overlays
    [/bg-white\/\[0\.02\]/g, 'bg-surface-2'],
    [/bg-white\/\[0\.03\]/g, 'bg-surface-2'],
    [/bg-white\/\[0\.04\]/g, 'bg-surface-2'],
    [/bg-white\/\[0\.05\]/g, 'bg-surface-2'],
    [/bg-white\/5/g, 'bg-surface-2'],
    [/bg-white\/10/g, 'bg-primary-soft'],
    [/bg-white\/20/g, 'bg-primary-soft'],

    [/hover:bg-white\/5/g, 'hover:bg-surface-2'],
    [/hover:bg-white\/10/g, 'hover:bg-primary-soft'],
    [/hover:bg-white\/\[0\.02\]/g, 'hover:bg-surface-2'],
    [/hover:bg-white\/\[0\.03\]/g, 'hover:bg-surface-2'],
    [/hover:bg-white\/\[0\.04\]/g, 'hover:bg-surface-2'],

    [/hover:border-white\/10/g, 'hover:border-border'],
    [/hover:border-white\/20/g, 'hover:border-border-strong'],
    [/hover:border-white\/30/g, 'hover:border-primary/40'],

    // text — order matters (most specific first)
    [/placeholder:text-slate-500/g, 'placeholder:text-text-3'],
    [/placeholder:text-slate-600/g, 'placeholder:text-text-3'],
    [/placeholder:text-slate-700/g, 'placeholder:text-text-3'],

    [/hover:text-white/g, 'hover:text-text-1'],
    [/hover:text-slate-200/g, 'hover:text-text-1'],
    [/hover:text-slate-300/g, 'hover:text-text-1'],

    [/text-slate-100/g, 'text-text-1'],
    [/text-slate-200/g, 'text-text-1'],
    [/text-slate-300/g, 'text-text-1'],
    [/text-slate-400/g, 'text-text-2'],
    [/text-slate-500/g, 'text-text-3'],
    [/text-slate-600/g, 'text-text-3'],
    [/text-slate-700/g, 'text-text-3'],

    // buttons / pills / accents that used pure white as primary
    [/bg-white text-slate-900/g, 'bg-primary text-text-inv'],
    [/bg-white\b(?!\/)/g, 'bg-primary'],
    [/text-slate-900/g, 'text-text-inv'],

    // status colors → tokens
    [/text-emerald-300/g, 'text-accent-text'],
    [/text-emerald-400/g, 'text-accent-text'],
    [/text-emerald-500/g, 'text-accent'],
    [/text-emerald-600/g, 'text-accent-text'],

    [/bg-emerald-500\/10/g, 'bg-accent-soft'],
    [/bg-emerald-500\/15/g, 'bg-accent-soft'],
    [/bg-emerald-500\/20/g, 'bg-accent-soft'],
    [/bg-emerald-500\/30/g, 'bg-accent-soft'],
    [/border-emerald-500\/30/g, 'border-accent/40'],
    [/border-emerald-500\/40/g, 'border-accent/50'],
    [/border-emerald-500\/50/g, 'border-accent/60'],

    [/text-rose-300/g, 'text-danger'],
    [/text-rose-400/g, 'text-danger'],
    [/text-rose-500/g, 'text-danger'],
    [/text-rose-600/g, 'text-danger'],
    [/text-red-300/g, 'text-danger'],
    [/text-red-400/g, 'text-danger'],
    [/text-red-500/g, 'text-danger'],
    [/text-red-600/g, 'text-danger'],

    [/bg-rose-500\/10/g, 'bg-danger-soft'],
    [/bg-rose-500\/15/g, 'bg-danger-soft'],
    [/bg-rose-500\/20/g, 'bg-danger-soft'],
    [/bg-red-500\/10/g, 'bg-danger-soft'],
    [/bg-red-500\/20/g, 'bg-danger-soft'],
    [/border-rose-500\/30/g, 'border-danger/40'],
    [/border-rose-500\/40/g, 'border-danger/50'],
    [/border-rose-500\/50/g, 'border-danger/60'],
    [/border-red-500\/30/g, 'border-danger/40'],
    [/border-red-500\/20/g, 'border-danger/30'],

    [/text-amber-300/g, 'text-warning'],
    [/text-amber-400/g, 'text-warning'],
    [/text-amber-500/g, 'text-warning'],
    [/text-amber-600/g, 'text-warning'],
    [/text-yellow-400/g, 'text-warning'],
    [/text-yellow-500/g, 'text-warning'],

    [/bg-amber-500\/10/g, 'bg-warning-soft'],
    [/bg-amber-500\/15/g, 'bg-warning-soft'],
    [/bg-amber-500\/20/g, 'bg-warning-soft'],
    [/bg-yellow-500\/10/g, 'bg-warning-soft'],
    [/bg-yellow-500\/20/g, 'bg-warning-soft'],
    [/border-amber-500\/30/g, 'border-warning/40'],
    [/border-amber-500\/40/g, 'border-warning/50'],

    [/text-blue-300/g, 'text-info'],
    [/text-blue-400/g, 'text-info'],
    [/text-blue-500/g, 'text-info'],
    [/text-blue-600/g, 'text-info'],
    [/text-sky-400/g, 'text-info'],
    [/text-sky-500/g, 'text-info'],

    [/bg-blue-500\/10/g, 'bg-info-soft'],
    [/bg-blue-500\/15/g, 'bg-info-soft'],
    [/bg-blue-500\/20/g, 'bg-info-soft'],
    [/bg-sky-500\/10/g, 'bg-info-soft'],
    [/bg-sky-500\/20/g, 'bg-info-soft'],
    [/border-blue-500\/30/g, 'border-info/40'],
    [/border-sky-500\/30/g, 'border-info/40'],

    // last resort plain text-white (after status maps)
    [/(?<![\w-])text-white\b(?!\/)/g, 'text-text-1'],

    // round-2xl bumped to round-md to match design unless explicitly larger
    [/rounded-2xl/g, 'rounded-md'],

    // ── Phase 2 additions (May 2026 audit) ────────────────────────────────

    // Z-index scale — Rules.md §5. Only the layers that map cleanly:
    //   z-50  → modal (most dangerous; collides with --z-modal)
    //   z-40  → overlay
    //   z-30  → dropdown
    // Leave z-10/z-20 alone — they're often legitimate internal stacking
    // contexts within a single component (image overlays, sticky table heads).
    [/(?<![\w-])z-50\b/g, 'z-modal'],
    [/(?<![\w-])z-40\b/g, 'z-overlay'],
    [/(?<![\w-])z-30\b/g, 'z-dropdown'],

    // White-glow hover shadows — invisible in light mode. Strip them.
    // Caller usually has a hover bg already; if not, prefer hover:bg-primary-hover.
    [/hover:shadow-\[0_4px_12px_rgba\(255,255,255,0\.\d+\)\]/g, 'hover:bg-primary-hover'],
    [/hover:shadow-\[0_8px_24px_rgba\(255,255,255,0\.\d+\)\]/g, 'hover:bg-primary-hover'],

    // Hover translate-up — micro-jitter that shifts layout. Just drop it.
    [/hover:-translate-y-0\.5/g, ''],

    // Radio dot color — invisible in light mode.
    [/accent-white\b/g, 'accent-[var(--primary)]'],

    // Force native picker into dark scheme — wrong when app is in light mode.
    [/\[color-scheme:dark\]/g, ''],

    // Slate-as-neutral backgrounds (inactive dots, neutral pills).
    [/bg-slate-600\b/g, 'bg-text-3'],
    [/bg-slate-500\b/g, 'bg-text-3'],
    [/bg-slate-200\b/g, 'bg-surface-2'],
    [/bg-slate-100\b/g, 'bg-surface-2'],
    [/bg-slate-500\/10/g, 'bg-surface-2'],
    [/bg-slate-500\/20/g, 'bg-surface-2'],
    [/bg-slate-500\/30/g, 'bg-surface-2'],
    [/bg-slate-900\/10/g, 'bg-surface-2'],
    [/border-slate-500\/30/g, 'border-border'],
    [/border-slate-400\b/g, 'border-border-strong'],
    [/border-t-slate-900\b/g, 'border-t-primary'],
    [/border-t-white\b/g, 'border-t-primary'],

    // Status pill mid-tones not yet covered above
    [/bg-emerald-400\b/g, 'bg-accent'],
    [/bg-rose-400\b/g, 'bg-danger'],
    [/bg-amber-400\b/g, 'bg-warning'],
    [/border-red-500\/50/g, 'border-danger'],
    [/border-rose-500\/40/g, 'border-danger'],

    // Dividers
    [/divide-white\/5/g, 'divide-border'],
    [/divide-white\/10/g, 'divide-border'],

    // text-amber for warning labels
    [/text-amber-200/g, 'text-warning'],
    [/text-amber-100/g, 'text-warning'],
];

const TARGET_DIRS = ['src/pages', 'src/components'];
const SKIP_FILES = new Set([
    // already migrated by hand
    'src/components/ui/Button.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Input.tsx',
    'src/components/ui/Modal.tsx',
    'src/components/ui/Pill.tsx',
    'src/components/ui/Avatar.tsx',
    'src/components/ui/KpiCard.tsx',
    'src/components/ui/Spark.tsx',
    'src/components/ui/PageHeader.tsx',
    'src/components/ui/Segmented.tsx',
    'src/components/ui/Stepper.tsx',
    'src/components/ui/StatusPill.tsx',
    'src/components/ui/EmptyState.tsx',
    'src/components/ui/Toolbar.tsx',
    'src/components/ui/Logo.tsx',
    'src/components/ui/ThemeToggle.tsx',
    'src/components/charts/AreaChart.tsx',
    'src/components/charts/BarChart.tsx',
    'src/components/charts/SalesChart.tsx',
    'src/components/notifications/NotificationDropdown.tsx',
    'src/pages/auth/LoginPage.tsx',
    'src/pages/auth/SignupPage.tsx',
    'src/pages/auth/OtpVerificationPage.tsx',
    'src/pages/auth/ChangePasswordPage.tsx',
    'src/pages/dashboard/DashboardPage.tsx',
    'src/pages/dashboard/CashierDashboardPage.tsx',
    'src/pages/pos/TransactionsPage.tsx',
]);

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const s = statSync(p);
        if (s.isDirectory()) walk(p, out);
        else if (extname(entry) === '.tsx' || extname(entry) === '.ts') out.push(p);
    }
    return out;
}

let touched = 0;
let total = 0;
for (const root of TARGET_DIRS) {
    for (const file of walk(root)) {
        const rel = file.replace(/\\/g, '/');
        if (SKIP_FILES.has(rel)) continue;
        total++;
        const content = readFileSync(file, 'utf8');
        let next = content;
        for (const [re, sub] of REPLACEMENTS) next = next.replace(re, sub);
        if (next !== content) {
            writeFileSync(file, next, 'utf8');
            touched++;
            console.log(`migrated ${rel}`);
        }
    }
}

console.log(`\nDone. ${touched}/${total} files modified.`);
