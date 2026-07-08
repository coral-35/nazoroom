create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  unique (event_id, nickname)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_code text not null,
  normalized_room_code text not null,
  explore_type text not null check (explore_type in ('hidden_clue', 'show_puzzle')),
  title text,
  puzzle_text text,
  puzzle_image_url text,
  hidden_message text,
  treasure_name text not null,
  treasure_description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, normalized_room_code)
);

create table if not exists public.room_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  answer_text text not null,
  normalized_answer text not null,
  created_at timestamptz not null default now(),
  unique (room_id, normalized_answer)
);

create table if not exists public.exploration_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  input_room_code text not null,
  normalized_room_code text not null,
  result_type text not null check (result_type in ('not_found', 'hidden_clue', 'show_puzzle')),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.player_treasures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  treasure_name text not null,
  unlocked_at timestamptz not null default now(),
  unique (player_id, room_id)
);

create table if not exists public.unlock_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  input_room_code text not null,
  normalized_room_code text not null,
  input_answer text not null,
  normalized_answer text not null,
  result text not null check (
    result in (
      'correct',
      'incorrect',
      'expired',
      'already_unlocked',
      'room_not_found'
    )
  ),
  created_at timestamptz not null default now()
);

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create index if not exists players_event_id_idx on public.players(event_id);
create index if not exists rooms_event_code_idx
  on public.rooms(event_id, normalized_room_code)
  where is_active;
create index if not exists room_answers_room_id_idx on public.room_answers(room_id);
create index if not exists exploration_logs_player_idx
  on public.exploration_logs(event_id, player_id, created_at);
create index if not exists player_treasures_event_idx
  on public.player_treasures(event_id, player_id);
create index if not exists unlock_attempts_player_idx
  on public.unlock_attempts(event_id, player_id, created_at);

alter table public.events enable row level security;
alter table public.players enable row level security;
alter table public.rooms enable row level security;
alter table public.room_answers enable row level security;
alter table public.exploration_logs enable row level security;
alter table public.player_treasures enable row level security;
alter table public.unlock_attempts enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on public.room_answers from anon, authenticated;
revoke all on public.unlock_attempts from anon, authenticated;
