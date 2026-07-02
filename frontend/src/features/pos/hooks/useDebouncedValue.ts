import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `ms` — resets the timer on every change so the
 * debounced value only settles once input pauses. Used by the POS typeahead
 * cards to avoid a lookup per keystroke.
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(handle);
  }, [value, ms]);
  return debounced;
}
