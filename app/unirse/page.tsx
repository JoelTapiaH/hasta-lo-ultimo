import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "@/components/Forms";
import { signOut } from "../actions";

export default async function Unirse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (me) redirect("/");

  return (
    <main className="center">
      <div className="card narrow">
        <p className="eyebrow">Bienvenido</p>
        <h1>Únete a la misión</h1>
        <p className="muted">Elige cómo te verá el grupo y escribe el código de invitación de tu célula.</p>
        <JoinForm />
        <form action={signOut}>
          <button className="link">Usar otra cuenta</button>
        </form>
      </div>
    </main>
  );
}
