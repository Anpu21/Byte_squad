import AuthBrandSceneDay from './AuthBrandSceneDay';
import AuthBrandSceneNight from './AuthBrandSceneNight';

/**
 * Theme-responsive brand scene for the auth panel: the daytime/sun storefront
 * in light theme, the night/moon storefront in dark theme.
 *
 * Both variants render; the inactive one is hidden via `data-theme`-gated CSS
 * (`.auth-scene-day` / `.auth-scene-night` in index.css). We switch in CSS — not
 * by reading `useTheme()` — because that hook holds per-component state with no
 * in-tab sharing, so it wouldn't re-render here when the ThemeToggle flips the
 * theme. `data-theme` on <html> is the global source of truth, and `display:none`
 * pauses the hidden scene's animations for free.
 */
export default function AuthBrandScene({ className }: { className?: string }) {
  return (
    <>
      <div className="auth-scene-day">
        <AuthBrandSceneDay className={className} />
      </div>
      <div className="auth-scene-night">
        <AuthBrandSceneNight className={className} />
      </div>
    </>
  );
}
