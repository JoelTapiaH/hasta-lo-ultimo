// Reglas del juego:
// - Cada día que al menos `threshold` (60%) de los miembros registra su devocional,
//   el grupo conquista el siguiente país (empezando en Jerusalén y avanzando hacia afuera).
// - Cada día cerrado que NO llega al mínimo, el último país conquistado se apaga.
// - El día de hoy cuenta en cuanto se alcanza el mínimo; si no, aún no castiga.

export type Member = { id: string; name: string; color: string; join_day: string };

export type GameState = {
  today: string;
  threshold: number;
  members: Member[];
  entries: Record<string, string[]>; // user_id -> días (YYYY-MM-DD)
};

export type DayResult = {
  day: string;
  members: number;
  done: number;
  required: number;
  success: boolean;
  event: "conquer" | "lose" | "none";
};

export type Game = {
  lit: number; // países encendidos ahora
  maxReached: number; // máximo que llegó a tener encendidos
  conqueredOn: string[]; // conqueredOn[i] = día en que se encendió el país i
  days: DayResult[];
  today: DayResult;
  streak: number; // días seguidos cumpliendo la meta
};

export function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function requiredFor(members: number, threshold: number): number {
  return Math.max(1, Math.ceil(members * threshold - 1e-9));
}

export function computeGame(s: GameState): Game {
  const byDay = new Map<string, Set<string>>();
  for (const [uid, days] of Object.entries(s.entries)) {
    for (const d of days) {
      if (!byDay.has(d)) byDay.set(d, new Set());
      byDay.get(d)!.add(uid);
    }
  }

  const start = s.members.reduce<string>((min, m) => (m.join_day < min ? m.join_day : min), s.today);

  let lit = 0;
  let maxReached = 0;
  const conqueredOn: string[] = [];
  const days: DayResult[] = [];

  for (let day = start; day <= s.today; day = addDays(day, 1)) {
    const active = s.members.filter((m) => m.join_day <= day);
    const doneSet = byDay.get(day);
    const done = active.filter((m) => doneSet?.has(m.id)).length;
    const required = requiredFor(active.length, s.threshold);
    const success = active.length > 0 && done >= required;
    let event: DayResult["event"] = "none";

    if (success) {
      conqueredOn[lit] = day;
      lit++;
      maxReached = Math.max(maxReached, lit);
      event = "conquer";
    } else if (day !== s.today && lit > 0) {
      lit--;
      event = "lose";
    }
    days.push({ day, members: active.length, done, required, success, event });
  }

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.day === s.today && !d.success) continue;
    if (!d.success) break;
    streak++;
  }

  return { lit, maxReached, conqueredOn: conqueredOn.slice(0, lit), days, today: days[days.length - 1], streak };
}

export function memberStreak(days: string[] | undefined, today: string): number {
  if (!days?.length) return 0;
  const set = new Set(days);
  let d = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function formatDay(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
