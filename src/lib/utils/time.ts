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

/**
 * Splits an actual tracked/elapsed duration into a value + unit the way a
 * stopwatch reads: seconds-only under a minute ("36" / "Sek."),
 * minutes:seconds from a minute up ("1:27" / "Min."). Split out from
 * formatTrackedDuration so a big timer display can size the number and the
 * unit label differently instead of one same-size string.
 */
export function splitTrackedDuration(totalSeconds: number): { value: string; unit: string } {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return { value: String(seconds), unit: "Sek." };
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return { value: `${minutes}:${String(remainingSeconds).padStart(2, "0")}`, unit: "Min." };
}

/**
 * Formats an actual tracked/elapsed duration the way a stopwatch reads:
 * seconds-only under a minute ("36 Sek."), minutes:seconds from a minute up
 * ("1:27 Min."). For live timer displays — planned/estimated durations
 * (never second-precise, only configurable in 5-minute steps) stay on
 * formatMinutes instead.
 */
export function formatTrackedDuration(totalSeconds: number): string {
  const { value, unit } = splitTrackedDuration(totalSeconds);
  return `${value} ${unit}`;
}
