import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "@/components/Forms";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function Unirse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("apostle").eq("id", user.id).maybeSingle();
  if (me?.apostle) redirect("/");

  const { data: taken } = await supabase.rpc("taken_apostles");
  const full = (taken ?? []).length >= 12;

  return (
    <main className="center">
      <div className="card narrow wide">
        <p className="eyebrow">Bienvenido</p>
        <h1>Únete a los doce</h1>
        {full ? (
          <p className="muted">Los doce apóstoles ya fueron elegidos. Habla con el líder de tu célula.</p>
        ) : (
          <JoinForm taken={taken ?? []} needsCode={!me} />
        )}
        <form action={signOut}>
          <button className="link">Usar otra cuenta</button>
        </form>
      </div>
    </main>
  );
}
