/** Formats a minute count as "1 Std 20 Min" / "45 Min". */
export function formatMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  if (rounded <= 0) return "0 Min";
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (hours === 0) return `${minutes} Min`;
  if (minutes === 0) return `${hours} Std`;
  return `${hours} Std ${minutes} Min`;
}

/** Formats a minute difference with an explicit sign, e.g. "+12 Min" / "±0 Min". */
export function formatSignedMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return "±0 Min";
  const sign = rounded > 0 ? "+" : "–";
  return `${sign}${formatMinutes(Math.abs(rounded))}`;
}
