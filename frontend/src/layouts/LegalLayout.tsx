import { Link, Outlet } from 'react-router-dom'
import { FRONTEND_ROUTES } from '@/constants/routes'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { LegalFooter } from '@/features/legal'

/**
 * Minimal public shell for the legal / policy pages. Anonymous-safe (no auth
 * check or redirect) so anyone — including the PayHere partner-bank reviewer —
 * can read the policies without signing in. A clean logo header + centred
 * content + a cross-link footer; deliberately not the storefront chrome
 * (cart / search would be out of place on a Terms page).
 */
export default function LegalLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-canvas font-sans text-text-1">
            <header className="sticky top-0 z-sticky border-b border-border bg-surface/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-[960px] items-center justify-between px-4 sm:px-6">
                    <Link
                        to={FRONTEND_ROUTES.ROOT}
                        aria-label="Home"
                        className="rounded-md focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/30"
                    >
                        <Logo size={34} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link
                            to={FRONTEND_ROUTES.LOGIN}
                            className="inline-flex h-9 items-center rounded-md px-3.5 text-[13px] font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[820px] flex-1 px-4 py-10 sm:px-6 sm:py-14">
                <Outlet />
            </main>

            <footer className="border-t border-border">
                <div className="mx-auto w-full max-w-[820px] px-4 py-8 sm:px-6">
                    <LegalFooter />
                </div>
            </footer>
        </div>
    )
}
