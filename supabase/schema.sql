-- =========================================================
--  Hasta lo último de la tierra — esquema de Supabase
--  Pega todo este archivo en Supabase > SQL Editor > Run
-- =========================================================

-- Configuración del grupo (una sola fila, nadie la puede leer desde la app)
create table if not exists public.app_config (
  id         int primary key default 1 check (id = 1),
  invite_code text not null,
  timezone    text not null default 'America/Lima',
  threshold   numeric not null default 0.6 check (threshold > 0 and threshold <= 1)
);
alter table public.app_config enable row level security;

-- Código de invitación: la "clave" que tus amigos escriben al unirse.
-- Cámbialo por el que quieras antes de correr esto.
insert into public.app_config (invite_code, timezone, threshold)
values ('HECHOS-1-8', 'America/Lima', 0.6)
on conflict (id) do nothing;

-- Miembros del grupo
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  color      text not null default '#f6c453' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

-- Devocionales: uno por persona por día
create table if not exists public.entries (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  passage    text not null check (char_length(passage) between 1 and 200),
  learning   text not null check (char_length(learning) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists entries_day_idx on public.entries (day);

-- "Hoy" según la zona horaria del grupo
create or replace function public.group_today()
returns date language sql stable security definer set search_path = public as $$
  select (now() at time zone (select timezone from app_config where id = 1))::date
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid())
$$;

-- Reglas de acceso
alter table public.profiles enable row level security;
alter table public.entries  enable row level security;

drop policy if exists "ver miembros" on public.profiles;
create policy "ver miembros" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_member());

drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "ver devocionales" on public.entries;
create policy "ver devocionales" on public.entries
  for select to authenticated using (public.is_member());

-- Solo puedes escribir TU devocional de HOY (no se vale rellenar días pasados)
drop policy if exists "registrar hoy" on public.entries;
create policy "registrar hoy" on public.entries
  for insert to authenticated
  with check (user_id = auth.uid() and day = public.group_today() and public.is_member());

drop policy if exists "editar hoy" on public.entries;
create policy "editar hoy" on public.entries
  for update to authenticated
  using (user_id = auth.uid() and day = public.group_today())
  with check (user_id = auth.uid() and day = public.group_today());

-- Unirse al grupo con el código de invitación
create or replace function public.join_group(p_code text, p_name text, p_color text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'No has iniciado sesión';
  end if;
  if p_code is distinct from (select invite_code from app_config where id = 1) then
    raise exception 'Código de invitación incorrecto';
  end if;
  insert into profiles (id, name, color)
  values (auth.uid(), trim(p_name), p_color)
  on conflict (id) do update set name = excluded.name, color = excluded.color;
end;
$$;

-- Todo lo que necesita el mapa, en una sola llamada (evita el límite de 1000 filas)
create or replace function public.game_state()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  tz text := (select timezone from app_config where id = 1);
begin
  if not is_member() then
    raise exception 'No eres miembro del grupo';
  end if;
  return jsonb_build_object(
    'today', group_today(),
    'threshold', (select threshold from app_config where id = 1),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'color', color,
        'join_day', (created_at at time zone tz)::date
      ) order by created_at), '[]'::jsonb)
      from profiles
    ),
    'entries', (
      select coalesce(jsonb_object_agg(user_id, days), '{}'::jsonb)
      from (select user_id, jsonb_agg(day order by day) as days from entries group by user_id) t
    )
  );
end;
$$;

revoke execute on function public.group_today(), public.is_member(),
  public.join_group(text, text, text), public.game_state() from anon, public;
grant execute on function public.group_today(), public.is_member(),
  public.join_group(text, text, text), public.game_state() to authenticated;
