import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/Forms";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="center">
      <div className="card narrow">
        <p className="eyebrow">Hechos 1:8</p>
        <h1>Hasta lo último de la tierra</h1>
        <p className="muted">
          Cada día que la célula hace su devocional, conquistamos un país. Si fallamos, la luz se apaga.
        </p>
        {error && <p className="feedback error">El enlace de confirmación no funcionó. Intenta entrar.</p>}
        <AuthForm />
      </div>
    </main>
  );
}
