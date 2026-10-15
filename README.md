# Hasta lo último de la tierra

> "…y me seréis testigos en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra." — Hechos 1:8

App web para que la célula registre su devocional diario y conquiste el mapa del mundo juntos.

## Cómo funciona el juego

- Cada quien registra **una vez al día** el pasaje que leyó y lo que aprendió.
- Si **al menos el 60%** del grupo registra su devocional ese día (6 de 10, 3 de 5…), se **conquista un país**: se ilumina en dorado.
- La conquista empieza en **Israel** y avanza hacia los países más cercanos, hasta lo último de la tierra (177 países).
- Si un día termina **sin** llegar al 60%, **el último país conquistado se apaga** (queda gris ceniza) y hay que reconquistarlo.
- Solo se puede registrar el devocional **del día de hoy** (no se pueden rellenar días pasados).
- Hay rachas personales 🔥 y del grupo.
- **Los doce:** cada miembro elige uno de los 12 apóstoles (Pedro, Andrés, Santiago el Mayor, Juan, Felipe, Bartolomé, Tomás, Mateo, Santiago el Menor, Tadeo, Simón el Zelote y **Pablo** como el 12º). Nadie ve nombres reales, solo el apóstol. Los ya elegidos aparecen bloqueados y **una vez elegido no se puede cambiar**. Máximo 12 miembros.

## Configuración (una sola vez, ~10 minutos)

### 1. Base de datos en Supabase (gratis)

1. Crea una cuenta en https://supabase.com y un proyecto nuevo.
2. Abre `supabase/schema.sql`, si quieres, cambia el código de invitación `HECHOS-1-8` por otro (la zona horaria ya está en `America/Lima`).
3. En Supabase ve a **SQL Editor**, pega todo el archivo y dale **Run**.
4. En **Authentication → Sign In / Providers → Email** puedes desactivar **Confirm email** para que tus amigos entren sin confirmar el correo (más fácil). Si lo dejas activo, configura en **Authentication → URL Configuration** el *Site URL* con la dirección de tu app.

### 2. Correr la app en tu compu

```bash
cp .env.local.example .env.local   # y pega tu URL y anon key (Supabase → Project Settings → API)
npm install
npm run dev
```

Abre http://localhost:3000

### 3. Publicarla para tus amigos (Vercel, gratis)

1. Sube esta carpeta a un repositorio de GitHub.
2. En https://vercel.com → *Add New Project* → importa el repositorio.
3. Agrega las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Comparte el link y el código de invitación con la célula.

### Si ya tenías la base de datos antes de los apóstoles

Corre también `supabase/002_apostoles.sql` en el SQL Editor. Quien ya estaba registrado tendrá que elegir su apóstol al entrar (borra los nombres reales que había).

## Cambiar reglas después

Desde el SQL Editor de Supabase:

```sql
update app_config set threshold = 0.7;              -- exigir 70%
update app_config set invite_code = 'NUEVO-CODIGO';  -- cambiar el código
update app_config set timezone = 'America/Bogota';  -- cambiar zona horaria
```

## Estructura

- `supabase/schema.sql` — tablas, permisos y funciones
- `lib/game.ts` — reglas de conquista (60%, encender/apagar países)
- `lib/world.ts` — orden de los países desde Jerusalén
- `components/WorldMap.tsx` — el mapa
- `app/page.tsx` — pantalla principal
