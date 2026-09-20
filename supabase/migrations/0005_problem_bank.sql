create table if not exists public.problem_bank (
  id uuid primary key default gen_random_uuid(),
  problem_number integer not null unique check (problem_number between 1 and 27),
  room_code text not null,
  normalized_room_code text not null,
  title text,
  puzzle_image_url text not null,
  default_answers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms
add column if not exists problem_id uuid references public.problem_bank(id) on delete set null;

drop trigger if exists set_problem_bank_updated_at on public.problem_bank;
create trigger set_problem_bank_updated_at
before update on public.problem_bank
for each row execute function public.set_updated_at();

create index if not exists problem_bank_number_idx on public.problem_bank(problem_number);
create index if not exists rooms_problem_id_idx on public.rooms(problem_id);

alter table public.problem_bank enable row level security;

grant select, insert, update, delete on public.problem_bank to service_role;

insert into public.problem_bank (
  id,
  problem_number,
  room_code,
  normalized_room_code,
  title,
  puzzle_image_url,
  default_answers
) values
('20000000-0000-0000-0000-000000000001', 1, '305', '305', '問題 1', '/puzzles/frame-01.png', array['ひかり']),
('20000000-0000-0000-0000-000000000002', 2, '204', '204', '問題 2', '/puzzles/frame-02.png', array['ほし']),
('20000000-0000-0000-0000-000000000003', 3, '101', '101', '問題 3', '/puzzles/frame-03.png', array['たいよう']),
('20000000-0000-0000-0000-000000000004', 4, '4', '4', '問題 4', '/puzzles/frame-04.png', array['答え4']),
('20000000-0000-0000-0000-000000000005', 5, '5', '5', '問題 5', '/puzzles/frame-05.png', array['答え5']),
('20000000-0000-0000-0000-000000000006', 6, '6', '6', '問題 6', '/puzzles/frame-06.png', array['答え6']),
('20000000-0000-0000-0000-000000000007', 7, '7', '7', '問題 7', '/puzzles/frame-07.png', array['答え7']),
('20000000-0000-0000-0000-000000000008', 8, '8', '8', '問題 8', '/puzzles/frame-08.png', array['答え8']),
('20000000-0000-0000-0000-000000000009', 9, '9', '9', '問題 9', '/puzzles/frame-09.png', array['答え9']),
('20000000-0000-0000-0000-000000000010', 10, '10', '10', '問題 10', '/puzzles/frame-10.png', array['答え10']),
('20000000-0000-0000-0000-000000000011', 11, '11', '11', '問題 11', '/puzzles/frame-11.png', array['答え11']),
('20000000-0000-0000-0000-000000000012', 12, '12', '12', '問題 12', '/puzzles/frame-12.png', array['答え12']),
('20000000-0000-0000-0000-000000000013', 13, '13', '13', '問題 13', '/puzzles/frame-13.png', array['答え13']),
('20000000-0000-0000-0000-000000000014', 14, '14', '14', '問題 14', '/puzzles/frame-14.png', array['答え14']),
('20000000-0000-0000-0000-000000000015', 15, '15', '15', '問題 15', '/puzzles/frame-15.png', array['答え15']),
('20000000-0000-0000-0000-000000000016', 16, '16', '16', '問題 16', '/puzzles/frame-16.png', array['答え16']),
('20000000-0000-0000-0000-000000000017', 17, '17', '17', '問題 17', '/puzzles/frame-17.png', array['答え17']),
('20000000-0000-0000-0000-000000000018', 18, '18', '18', '問題 18', '/puzzles/frame-18.png', array['答え18']),
('20000000-0000-0000-0000-000000000019', 19, '19', '19', '問題 19', '/puzzles/frame-19.png', array['答え19']),
('20000000-0000-0000-0000-000000000020', 20, '20', '20', '問題 20', '/puzzles/frame-20.png', array['答え20']),
('20000000-0000-0000-0000-000000000021', 21, '21', '21', '問題 21', '/puzzles/frame-21.png', array['答え21']),
('20000000-0000-0000-0000-000000000022', 22, '22', '22', '問題 22', '/puzzles/frame-22.png', array['答え22']),
('20000000-0000-0000-0000-000000000023', 23, '23', '23', '問題 23', '/puzzles/frame-23.png', array['答え23']),
('20000000-0000-0000-0000-000000000024', 24, '24', '24', '問題 24', '/puzzles/frame-24.png', array['答え24']),
('20000000-0000-0000-0000-000000000025', 25, '25', '25', '問題 25', '/puzzles/frame-25.png', array['答え25']),
('20000000-0000-0000-0000-000000000026', 26, '26', '26', '問題 26', '/puzzles/frame-26.png', array['答え26']),
('20000000-0000-0000-0000-000000000027', 27, '27', '27', '問題 27', '/puzzles/frame-27.png', array['答え27'])
on conflict (problem_number) do update
set
  room_code = excluded.room_code,
  normalized_room_code = excluded.normalized_room_code,
  title = excluded.title,
  puzzle_image_url = excluded.puzzle_image_url,
  default_answers = excluded.default_answers;
