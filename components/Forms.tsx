"use client";

import { useActionState, useState } from "react";
import { joinGroup, saveEntry, signIn, signUp, type FormState } from "@/app/actions";

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

export const COLORS = ["#f6c453", "#ff8a5b", "#ff5d8f", "#c77dff", "#5e9bff", "#3ddbd9", "#6fdc6f", "#f2f2f2"];

export function JoinForm() {
  const [state, action, pending] = useActionState(joinGroup, undefined);
  return (
    <form action={action} className="stack">
      <label>
        Tu nombre
        <input name="name" required maxLength={40} placeholder="Como te conocen en la célula" />
      </label>
      <fieldset className="colors">
        <legend>Tu color</legend>
        {COLORS.map((c, i) => (
          <label key={c} className="swatch" style={{ background: c }}>
            <input type="radio" name="color" value={c} defaultChecked={i === 0} aria-label={c} />
          </label>
        ))}
      </fieldset>
      <label>
        Código de invitación
        <input name="code" required placeholder="Te lo da el líder del grupo" />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "…" : "Unirme a la misión"}
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
