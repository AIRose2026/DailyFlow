/** Formats a minute count as "1 Std 20 Min" / "45 Min". */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 Min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours} Std`;
  return `${hours} Std ${minutes} Min`;
}
