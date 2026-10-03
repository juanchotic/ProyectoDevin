const DAY = 86400000;

export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function parseWeek(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return mondayOf(d);
  }
  return mondayOf(new Date());
}

export function addWeeks(week: string, n: number): string {
  return new Date(new Date(`${week}T00:00:00Z`).getTime() + n * 7 * DAY).toISOString().slice(0, 10);
}

export function formatWeek(week: string): string {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * DAY);
  const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt.format(start)} – ${fmt.format(end)} ${end.getUTCFullYear()}`;
}
