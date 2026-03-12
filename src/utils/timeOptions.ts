/** Time options at 15-minute intervals (00:00, 00:15, ..., 23:45) for dropdowns */
export const TIME_OPTIONS_15MIN: string[] = [];
for (let h = 9; h <=20; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS_15MIN.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
  }
}

/** Round a time string (HH:mm or HH:mm:ss) to the nearest 15 minutes (HH:mm) */
export function roundTimeTo15Min(timeStr: string): string {
  if (!timeStr) return "00:00";
  const [h, m] = timeStr.split(":").map(Number);
  const mins = (h ?? 0) * 60 + (m ?? 0);
  const rounded = Math.round(mins / 15) * 15;
  const rh = Math.floor(rounded / 60) % 24;
  const rm = rounded % 60;
  return `${rh.toString().padStart(2, "0")}:${rm.toString().padStart(2, "0")}`;
}

/** From an ISO datetime string, return local date (YYYY-MM-DD) and time rounded to 15 min (HH:mm) */
export function parseScheduledAtToLocalDateAndTime(iso: string | null): { date: string; time: string } {
  if (!iso) {
    const today = new Date();
    return {
      date: today.toISOString().slice(0, 10),
      time: "09:00",
    };
  }
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const mins = hours * 60 + minutes;
  const rounded = Math.round(mins / 15) * 15;
  const rh = Math.floor(rounded / 60) % 24;
  const rm = rounded % 60;
  const time = `${rh.toString().padStart(2, "0")}:${rm.toString().padStart(2, "0")}`;
  return { date, time };
}
