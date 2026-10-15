import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDays, computeGame, formatDay, memberStreak, type GameState } from "@/lib/game";
import { COUNTRIES } from "@/lib/world";
import WorldMap from "@/components/WorldMap";
import { EntryForm } from "@/components/Forms";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

type Entry = { id: number; user_id: string; day: string; passage: string; learning: string };

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!me) redirect("/unirse");

  const { data: state, error } = await supabase.rpc("game_state");
  if (error || !state) throw new Error(error?.message ?? "No se pudo cargar el juego");
  const s = state as GameState;
  const game = computeGame(s);

  const { data: recentData } = await supabase
    .from("entries")
    .select("id,user_id,day,passage,learning")
    .gte("day", addDays(s.today, -6))
    .order("day", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  const recent = (recentData ?? []) as Entry[];
  const mine = recent.find((e) => e.user_id === user.id && e.day === s.today);

  const members = new Map(s.members.map((m) => [m.id, m]));
  const t = game.today;
  const missing = Math.max(0, t.required - t.done);
  const target = COUNTRIES[game.lit - (t.success ? 1 : 0)] ?? COUNTRIES[game.lit];
  const percent = Math.round((game.lit / COUNTRIES.length) * 100);
  const last14 = game.days.slice(-14);

  const feedDays = [...new Set(recent.map((e) => e.day))];
  const ranking = [...s.members]
    .map((m) => ({ ...m, streak: memberStreak(s.entries[m.id], s.today), total: s.entries[m.id]?.length ?? 0, today: s.entries[m.id]?.includes(s.today) }))
    .sort((a, b) => b.streak - a.streak || b.total - a.total);

  return (
    <main className="page">
      <header className="top">
        <div>
          <p className="eyebrow">Hechos 1:8</p>
          <h1>Hasta lo último de la tierra</h1>
        </div>
        <form action={signOut}>
          <button className="link">Salir</button>
        </form>
      </header>

      <section className="stats">
        <div className="stat">
          <b>{game.lit}</b>
          <span>de {COUNTRIES.length} países · {percent}% del mundo</span>
        </div>
        <div className="stat">
          <b>{game.streak}</b>
          <span>días seguidos cumpliendo la meta</span>
        </div>
        <div className="stat">
          <b>{game.maxReached - game.lit}</b>
          <span>países apagados por reconquistar</span>
        </div>
      </section>

      <WorldMap lit={game.lit} maxReached={game.maxReached} conqueredOn={game.conqueredOn} todayDone={t.done} todayRequired={t.required} />

      <div className="grid">
        <section className="card">
          <h2>{t.success ? `¡${target.name} conquistado hoy!` : `Hoy vamos por ${target.name}`}</h2>
          <div className="progress" aria-label={`${t.done} de ${t.required}`}>
            <div style={{ width: `${Math.min(100, (t.done / t.required) * 100)}%` }} />
          </div>
          <p className="muted">
            {t.done} de {t.members} hicieron su devocional · se necesitan {t.required} ({Math.round(s.threshold * 100)}%).{" "}
            {t.success ? "¡Meta cumplida! Sigan sumando." : `Faltan ${missing}. Si no llegamos, se apaga un país.`}
          </p>
          <div className="days" title="Últimos 14 días">
            {last14.map((d) => (
              <span
                key={d.day}
                className={d.success ? "ok" : d.day === s.today ? "pending" : "fail"}
                title={`${formatDay(d.day)}: ${d.done}/${d.required}`}
              />
            ))}
          </div>

          <h3>{mine ? "Tu devocional de hoy" : "Registra tu devocional"}</h3>
          <EntryForm key={mine?.id ?? "new"} passage={mine?.passage} learning={mine?.learning} />
        </section>

        <section className="card">
          <h2>La célula</h2>
          <ul className="ranking">
            {ranking.map((m) => (
              <li key={m.id}>
                <i className="avatar" style={{ background: m.color }}>{m.name[0]?.toUpperCase()}</i>
                <span className="name">{m.name}{m.id === user.id && " (tú)"}</span>
                <span className={m.today ? "check on" : "check"}>{m.today ? "✓ hoy" : "pendiente"}</span>
                <span className="streak">🔥 {m.streak}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card feed">
        <h2>Lo que hemos aprendido</h2>
        {feedDays.length === 0 && <p className="muted">Todavía no hay devocionales esta semana. ¡Sé el primero en encender una luz!</p>}
        {feedDays.map((day) => (
          <div key={day}>
            <h3 className="feed-day">{day === s.today ? "Hoy" : formatDay(day)}</h3>
            {recent.filter((e) => e.day === day).map((e) => {
              const m = members.get(e.user_id);
              return (
                <article key={e.id} className="entry" style={{ borderColor: m?.color }}>
                  <header>
                    <strong style={{ color: m?.color }}>{m?.name ?? "—"}</strong>
                    <span className="passage">{e.passage}</span>
                  </header>
                  <p>{e.learning}</p>
                </article>
              );
            })}
          </div>
        ))}
      </section>
    </main>
  );
}
