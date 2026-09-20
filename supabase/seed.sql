insert into public.events (id, title, status, starts_at, ends_at, duration_minutes)
values (
  '00000000-0000-0000-0000-000000000001',
  '謎解きダンジョン',
  'draft',
  null,
  null,
  60
)
on conflict (id) do update
set
  title = excluded.title,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  duration_minutes = excluded.duration_minutes;

insert into public.problem_bank (
  id,
  problem_number,
  room_code,
  normalized_room_code,
  title,
  puzzle_image_url,
  default_answers,
  is_reserve
) values
('20000000-0000-0000-0000-000000000001', 1, '305', '305', '問題 1', '/puzzles/frame-01.png', array['ひかり'], false),
('20000000-0000-0000-0000-000000000002', 2, '204', '204', '問題 2', '/puzzles/frame-02.png', array['ほし'], false),
('20000000-0000-0000-0000-000000000003', 3, '101', '101', '問題 3', '/puzzles/frame-03.png', array['たいよう'], false),
('20000000-0000-0000-0000-000000000004', 4, '4', '4', '問題 4', '/puzzles/frame-04.png', array['答え4'], false),
('20000000-0000-0000-0000-000000000005', 5, '5', '5', '問題 5', '/puzzles/frame-05.png', array['答え5'], false),
('20000000-0000-0000-0000-000000000006', 6, '6', '6', '問題 6', '/puzzles/frame-06.png', array['答え6'], false),
('20000000-0000-0000-0000-000000000007', 7, '7', '7', '問題 7', '/puzzles/frame-07.png', array['答え7'], false),
('20000000-0000-0000-0000-000000000008', 8, '8', '8', '問題 8', '/puzzles/frame-08.png', array['答え8'], false),
('20000000-0000-0000-0000-000000000009', 9, '9', '9', '問題 9', '/puzzles/frame-09.png', array['答え9'], false),
('20000000-0000-0000-0000-000000000010', 10, '10', '10', '問題 10', '/puzzles/frame-10.png', array['答え10'], false),
('20000000-0000-0000-0000-000000000011', 11, '11', '11', '問題 11', '/puzzles/frame-11.png', array['答え11'], false),
('20000000-0000-0000-0000-000000000012', 12, '12', '12', '問題 12', '/puzzles/frame-12.png', array['答え12'], false),
('20000000-0000-0000-0000-000000000013', 13, '13', '13', '問題 13', '/puzzles/frame-13.png', array['答え13'], false),
('20000000-0000-0000-0000-000000000014', 14, '14', '14', '問題 14', '/puzzles/frame-14.png', array['答え14'], false),
('20000000-0000-0000-0000-000000000015', 15, '15', '15', '問題 15', '/puzzles/frame-15.png', array['答え15'], false),
('20000000-0000-0000-0000-000000000016', 16, '16', '16', '問題 16', '/puzzles/frame-16.png', array['答え16'], false),
('20000000-0000-0000-0000-000000000017', 17, '17', '17', '問題 17', '/puzzles/frame-17.png', array['答え17'], false),
('20000000-0000-0000-0000-000000000018', 18, '18', '18', '問題 18', '/puzzles/frame-18.png', array['答え18'], false),
('20000000-0000-0000-0000-000000000019', 19, '19', '19', '問題 19', '/puzzles/frame-19.png', array['答え19'], false),
('20000000-0000-0000-0000-000000000020', 20, '20', '20', '問題 20', '/puzzles/frame-20.png', array['答え20'], false),
('20000000-0000-0000-0000-000000000021', 21, '21', '21', '問題 21', '/puzzles/frame-21.png', array['答え21'], false),
('20000000-0000-0000-0000-000000000022', 22, '22', '22', '問題 22', '/puzzles/frame-22.png', array['答え22'], false),
('20000000-0000-0000-0000-000000000023', 23, '23', '23', '問題 23', '/puzzles/frame-23.png', array['答え23'], false),
('20000000-0000-0000-0000-000000000024', 24, '24', '24', '問題 24', '/puzzles/frame-24.png', array['答え24'], false),
('20000000-0000-0000-0000-000000000025', 25, '25', '25', '問題 25', '/puzzles/frame-25.png', array['答え25'], false),
('20000000-0000-0000-0000-000000000026', 26, '26', '26', '問題 26', '/puzzles/frame-26.png', array['答え26'], false),
('20000000-0000-0000-0000-000000000027', 27, '27', '27', '予備', '/puzzles/frame-27.png', array['答え27'], true)
on conflict (problem_number) do update
set
  room_code = excluded.room_code,
  normalized_room_code = excluded.normalized_room_code,
  title = excluded.title,
  puzzle_image_url = excluded.puzzle_image_url,
  default_answers = excluded.default_answers,
  is_reserve = excluded.is_reserve;

insert into public.rooms (
  id,
  event_id,
  problem_id,
  room_code,
  normalized_room_code,
  explore_type,
  title,
  puzzle_text,
  puzzle_image_url,
  hidden_message,
  sort_order,
  is_active
) values
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '305',
  '305',
  'show_puzzle',
  '古びた時計の暗号',
  '時計の針が示す言葉を読め。',
  '/puzzles/frame-01.png',
  null,
  1,
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '204',
  '204',
  'hidden_clue',
  '現地探索型の謎',
  null,
  null,
  '部屋204の周囲に、画面には映らない違和感がある。',
  2,
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000003',
  '101',
  '101',
  'show_puzzle',
  '封筒の記号',
  '封筒に描かれた線を順にたどれ。',
  '/puzzles/frame-03.png',
  null,
  3,
  true
)
on conflict (event_id, normalized_room_code) do update
set
  room_code = excluded.room_code,
  problem_id = excluded.problem_id,
  explore_type = excluded.explore_type,
  title = excluded.title,
  puzzle_text = excluded.puzzle_text,
  puzzle_image_url = excluded.puzzle_image_url,
  hidden_message = excluded.hidden_message,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.room_answers (room_id, answer_text, normalized_answer)
values
('10000000-0000-0000-0000-000000000001', 'ひかり', 'ひかり'),
('10000000-0000-0000-0000-000000000002', 'ほし', 'ほし'),
('10000000-0000-0000-0000-000000000003', 'たいよう', 'たいよう')
on conflict (room_id, normalized_answer) do update
set answer_text = excluded.answer_text;
