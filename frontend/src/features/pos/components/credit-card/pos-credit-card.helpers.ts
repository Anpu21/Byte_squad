import axios from 'axios';

/** Strip display formatting from a typed phone string (digits + leading `+`). */
export function sanitisePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

/**
 * Pull a human-readable message off whatever a credit mutation rejected with.
 * Prefers the backend's exception payload, falls back to `error.message`, then
 * a generic string so the cashier never sees `[object Object]`.
 */
export function extractCreditError(error: unknown): string | null {
  if (!error) return null;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
