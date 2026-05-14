export const SRI_LANKA_PHONE_REGEX = /^\+94[1-9][0-9]{8}$/;

export function normalizeSriLankaPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const stripped = input.replace(/[\s\-()]/g, '');
  if (stripped.length === 0) return null;

  let candidate: string;
  if (stripped.startsWith('+94')) {
    candidate = stripped;
  } else if (stripped.startsWith('0094')) {
    candidate = '+' + stripped.slice(2);
  } else if (stripped.startsWith('0')) {
    candidate = '+94' + stripped.slice(1);
  } else {
    return null;
  }

  return SRI_LANKA_PHONE_REGEX.test(candidate) ? candidate : null;
}
