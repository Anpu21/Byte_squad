import axios from 'axios'

/**
 * Extract a human-readable message from an unknown thrown value: the server's
 * `{ message }` for axios errors, otherwise the Error message, otherwise the
 * provided fallback. Keeps call sites free of `any`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined
    if (typeof data?.message === 'string') return data.message
    return error.message || fallback
  }
  if (error instanceof Error) return error.message || fallback
  return fallback
}
