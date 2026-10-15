"use client";

import { useActionState, useState } from "react";
import { joinGroup, saveEntry, signIn, signUp, type FormState } from "@/app/actions";
import { APOSTLES } from "@/lib/apostles";

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <p className="feedback error">{state.error}</p>;
  if (state?.message) return <p className="feedback ok">{state.message}</p>;
  return null;
}

export function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(signUp, undefined);
  const pending = mode === "in" ? inPending : upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="stack">
      <label>
        Correo
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "…" : mode === "in" ? "Entrar" : "Crear cuenta"}
      </button>
      <Feedback state={mode === "in" ? inState : upState} />
      <button type="button" className="link" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "¿Primera vez? Crea tu cuenta" : "Ya tengo cuenta"}
      </button>
    </form>
  );
}

export function JoinForm({ taken, needsCode }: { taken: string[]; needsCode: boolean }) {
  const [state, action, pending] = useActionState(joinGroup, undefined);
  const [choice, setChoice] = useState<string>("");
  const chosen = APOSTLES.find((a) => a.id === choice);

  return (
    <form action={action} className="stack">
      <fieldset className="apostles">
        <legend>Elige tu apóstol</legend>
        {APOSTLES.map((a, i) => {
          const isTaken = taken.includes(a.id);
          return (
            <label key={a.id} className={`apostle-pick${isTaken ? " taken" : ""}`} style={{ "--c": a.color } as React.CSSProperties}>
              <input type="radio" name="apostle" value={a.id} disabled={isTaken} required onChange={() => setChoice(a.id)} />
              <span className="emoji" aria-hidden>{a.emoji}</span>
              <span className="apostle-name">{a.name}</span>
              <span className="apostle-meta">{isTaken ? "Ya elegido" : `#${i + 1}`}</span>
            </label>
          );
        })}
      </fieldset>
      {needsCode && (
        <label>
          Código de invitación
          <input name="code" required placeholder="Te lo da el líder del grupo" />
        </label>
      )}
      <p className="muted small">
        Nadie sabrá quién eres: el grupo solo verá a tu apóstol. <strong>Una vez elegido no se puede cambiar.</strong>
      </p>
      <button className="btn" disabled={pending || !chosen}>
        {pending ? "…" : chosen ? `Ser ${chosen.name} ${chosen.emoji}` : "Elige un apóstol"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function EntryForm({ passage, learning }: { passage?: string; learning?: string }) {
  const [state, action, pending] = useActionState(saveEntry, undefined);
  const editing = Boolean(passage);
  return (
    <form action={action} className="stack">
      <label>
        Pasaje que leíste
        <input name="passage" required maxLength={200} defaultValue={passage} placeholder="Ej. Juan 15:1-11" />
      </label>
      <label>
        ¿Qué aprendiste hoy?
        <textarea name="learning" required maxLength={4000} rows={5} defaultValue={learning} placeholder="Lo que Dios te habló, cómo lo vas a aplicar…" />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Guardando…" : editing ? "Actualizar mi devocional" : "Encender mi luz de hoy"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
