"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// Supabase exige un correo: el nombre de usuario se convierte en uno interno que nadie ve.
// "José Pérez" -> jose-perez@usuarios.hasta-lo-ultimo.app
function usernameToEmail(name: string): string | null {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug ? `${slug}@usuarios.hasta-lo-ultimo.app` : null;
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const email = usernameToEmail(str(fd, "username"));
  if (!email) return { error: "Escribe tu nombre de usuario." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: str(fd, "password") });
  if (error) return { error: "Nombre o contraseña incorrectos." };
  redirect("/");
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const email = usernameToEmail(str(fd, "username"));
  if (!email) return { error: "Usa letras o números en tu nombre de usuario." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password: str(fd, "password") });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: "Ese nombre ya está en uso. Prueba con otro." };
    if (/password/i.test(error.message)) return { error: "La contraseña debe tener al menos 6 caracteres." };
    return { error: error.message };
  }
  if (!data.session) return { error: "Falta desactivar \"Confirm email\" en Supabase. Avísale al líder." };
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
