// Los doce: Pablo ocupa el lugar 12.
// Los ids deben coincidir con el check de la columna profiles.apostle en supabase/schema.sql.
export const APOSTLES = [
  { id: "pedro", name: "Pedro", emoji: "🗝️", color: "#f6c453" },
  { id: "andres", name: "Andrés", emoji: "🐟", color: "#5e9bff" },
  { id: "santiago_mayor", name: "Santiago el Mayor", emoji: "🐚", color: "#ff8a5b" },
  { id: "juan", name: "Juan", emoji: "🦅", color: "#c77dff" },
  { id: "felipe", name: "Felipe", emoji: "🍞", color: "#e9b872" },
  { id: "bartolome", name: "Bartolomé", emoji: "📖", color: "#3ddbd9" },
  { id: "tomas", name: "Tomás", emoji: "📐", color: "#9fd36b" },
  { id: "mateo", name: "Mateo", emoji: "🪙", color: "#ffd166" },
  { id: "santiago_menor", name: "Santiago el Menor", emoji: "⛪", color: "#ff5d8f" },
  { id: "tadeo", name: "Tadeo", emoji: "🔥", color: "#ff7a45" },
  { id: "simon", name: "Simón el Zelote", emoji: "⚓", color: "#7ec8ff" },
  { id: "pablo", name: "Pablo", emoji: "✉️", color: "#f2f2f2" },
] as const;

export type Apostle = (typeof APOSTLES)[number];

export function apostle(id: string | null | undefined): Apostle | undefined {
  return APOSTLES.find((a) => a.id === id);
}
