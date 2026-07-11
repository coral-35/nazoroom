alter table public.events
add column if not exists duration_minutes integer not null default 60;

alter table public.events
drop constraint if exists events_duration_minutes_check;

alter table public.events
add constraint events_duration_minutes_check
check (duration_minutes between 1 and 1440);
