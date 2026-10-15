"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: str(fd, "password") });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/");
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password: str(fd, "password"),
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve aquí." };
  redirect("/unirse");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function joinGroup(_: FormState, fd: FormData): Promise<FormState> {
  const apostle = str(fd, "apostle");
  if (!apostle) return { error: "Elige a tu apóstol." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_group", { p_code: str(fd, "code"), p_apostle: apostle });
  if (error) {
    if (error.message.includes("Código")) return { error: "Ese código de invitación no es correcto." };
    if (error.message.includes("ya fue elegido")) return { error: "Alguien acaba de elegir ese apóstol. Escoge otro." };
    if (error.message.includes("Ya elegiste")) redirect("/");
    return { error: error.message };
  }
  redirect("/");
}

export async function saveEntry(_: FormState, fd: FormData): Promise<FormState> {
  const passage = str(fd, "passage");
  const learning = str(fd, "learning");
  if (!passage || !learning) return { error: "Escribe el pasaje y lo que aprendiste." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: today, error: dayError } = await supabase.rpc("group_today");
  if (dayError) return { error: dayError.message };

  const { error } = await supabase
    .from("entries")
    .upsert(
      { user_id: user.id, day: today, passage: passage.slice(0, 200), learning: learning.slice(0, 4000), updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" },
    );
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  revalidatePath("/");
  return { message: "¡Guardado! Tu luz ya cuenta para hoy." };
}
