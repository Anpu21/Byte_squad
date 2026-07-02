/** One-decimal percentage of part/whole (0 when whole is 0). */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}
