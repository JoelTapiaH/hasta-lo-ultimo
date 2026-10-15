-- =========================================================
--  Migración: alias de apóstoles (anónimos)
--  Pega este archivo en Supabase > SQL Editor > Run
--  (solo si ya corriste schema.sql antes de este cambio)
-- =========================================================

-- Cada miembro es un apóstol; nadie ve nombres reales.
alter table public.profiles add column if not exists apostle text unique
  check (apostle in ('pedro','andres','santiago_mayor','juan','felipe','bartolome',
                     'tomas','mateo','santiago_menor','tadeo','simon','pablo'));
alter table public.profiles drop column if exists name;
alter table public.profiles drop column if exists color;

-- El apóstol no se puede cambiar: ya no hay permiso de editar el perfil
drop policy if exists "editar mi perfil" on public.profiles;

-- Solo es miembro quien ya eligió apóstol
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and apostle is not null)
$$;

drop function if exists public.join_group(text, text, text);

create or replace function public.join_group(p_code text, p_apostle text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_exists  boolean := false;
  v_current text;
begin
  if auth.uid() is null then
    raise exception 'No has iniciado sesión';
  end if;

  select true, apostle into v_exists, v_current from profiles where id = auth.uid();
  if v_current is not null then
    raise exception 'Ya elegiste a tu apóstol';
  end if;

  if not coalesce(v_exists, false)
     and p_code is distinct from (select invite_code from app_config where id = 1) then
    raise exception 'Código de invitación incorrecto';
  end if;

  if coalesce(v_exists, false) then
    update profiles set apostle = p_apostle where id = auth.uid();
  else
    insert into profiles (id, apostle) values (auth.uid(), p_apostle);
  end if;
exception
  when unique_violation then raise exception 'Ese apóstol ya fue elegido';
  when check_violation then raise exception 'Apóstol no válido';
end;
$$;

-- Qué apóstoles ya están tomados (sin revelar quién los tomó)
create or replace function public.taken_apostles()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(apostle), '{}') from profiles where apostle is not null
$$;

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
        'id', id, 'apostle', apostle,
        'join_day', (created_at at time zone tz)::date
      ) order by created_at), '[]'::jsonb)
      from profiles where apostle is not null
    ),
    'entries', (
      select coalesce(jsonb_object_agg(user_id, days), '{}'::jsonb)
      from (select user_id, jsonb_agg(day order by day) as days from entries group by user_id) t
    )
  );
end;
$$;

revoke execute on function public.join_group(text, text), public.taken_apostles() from anon, public;
grant execute on function public.join_group(text, text), public.taken_apostles() to authenticated;
