-- Apply once in the Supabase SQL editor. All writes go through the server.
create table public.rooms (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id),
 title text not null check (char_length(title) between 1 and 80), invite_hash text not null unique,
 starts_at timestamptz not null, ends_at timestamptz not null, locked boolean not null default false,
 closed boolean not null default false, capacity integer not null default 8 check(capacity between 2 and 12),
 check(ends_at = starts_at + interval '20 minutes')
);
create table public.members (
 room_id uuid references public.rooms(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 32),
 joined_at timestamptz not null default now(), left_at timestamptz, banned boolean not null default false,
 hand_at timestamptz, last_seen_at timestamptz not null default now(), primary key(room_id,user_id)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
 reporter_id uuid not null references auth.users(id), target_id uuid not null references auth.users(id),
 reason text not null check(char_length(reason) between 1 and 1000), created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
alter table public.members enable row level security;
alter table public.reports enable row level security;
revoke all on public.rooms, public.members, public.reports from anon, authenticated;
grant select on public.members to authenticated;
create policy own_history on public.members for select to authenticated using(user_id = auth.uid());
grant all on public.rooms, public.members, public.reports to service_role;
-- Lock the room row so simultaneous joins cannot exceed capacity.
create function public.join_pilot(p_room uuid, p_user uuid, p_name text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.rooms; m public.members;
begin
 select * into r from public.rooms where id=p_room for update;
 if not found or r.closed or now() >= r.ends_at or now() < r.starts_at then raise exception 'Room unavailable'; end if;
 select * into m from public.members where room_id=p_room and user_id=p_user;
 if m.banned then raise exception 'Room unavailable'; end if;
 if r.locked and p_user <> r.host_id then raise exception 'Room locked'; end if;
 if (m.user_id is null or m.left_at is not null) and (select count(*) from public.members where room_id=p_room and left_at is null and not banned) >= r.capacity then raise exception 'Room full'; end if;
 insert into public.members(room_id,user_id,display_name) values(p_room,p_user,p_name)
 on conflict(room_id,user_id) do update set left_at=null,last_seen_at=now(),display_name=excluded.display_name;
end $$;
revoke all on function public.join_pilot(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.join_pilot(uuid,uuid,text) to service_role;
create index rooms_expiry on public.rooms(ends_at) where not closed;
