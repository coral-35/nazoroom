create table if not exists public.app_settings (
  id text primary key,
  current_event_id uuid not null references public.events(id) on delete restrict,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

grant select, insert, update, delete on public.app_settings to service_role;

insert into public.app_settings (id, current_event_id)
values ('current', '00000000-0000-0000-0000-000000000001')
on conflict (id) do update
set current_event_id = excluded.current_event_id;
