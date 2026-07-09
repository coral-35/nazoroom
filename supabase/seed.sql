insert into public.events (id, title, status, starts_at, ends_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'MVPテスト宝探し',
  'draft',
  null,
  null
)
on conflict (id) do update
set
  title = excluded.title,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

insert into public.rooms (
  id,
  event_id,
  room_code,
  normalized_room_code,
  explore_type,
  title,
  puzzle_text,
  puzzle_image_url,
  hidden_message,
  treasure_name,
  treasure_description,
  sort_order,
  is_active
) values
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '305',
  '305',
  'show_puzzle',
  '古びた時計の暗号',
  '時計の針が示す言葉を読め。',
  null,
  null,
  '月の鍵',
  '淡く光る銀色の鍵。',
  1,
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '204',
  '204',
  'hidden_clue',
  '現地探索型の謎',
  null,
  null,
  '部屋204の周囲に、画面には映らない違和感がある。',
  '星の鍵',
  '小さな星形の鍵。',
  2,
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'A-01',
  'A-01',
  'show_puzzle',
  '封筒の記号',
  '封筒に描かれた線を順にたどれ。',
  null,
  null,
  '太陽の鍵',
  'あたたかく光る金色の鍵。',
  3,
  true
)
on conflict (event_id, normalized_room_code) do update
set
  room_code = excluded.room_code,
  explore_type = excluded.explore_type,
  title = excluded.title,
  puzzle_text = excluded.puzzle_text,
  puzzle_image_url = excluded.puzzle_image_url,
  hidden_message = excluded.hidden_message,
  treasure_name = excluded.treasure_name,
  treasure_description = excluded.treasure_description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.room_answers (room_id, answer_text, normalized_answer)
values
('10000000-0000-0000-0000-000000000001', 'ひかり', 'ひかり'),
('10000000-0000-0000-0000-000000000002', 'ほし', 'ほし'),
('10000000-0000-0000-0000-000000000003', 'たいよう', 'たいよう')
on conflict (room_id, normalized_answer) do update
set answer_text = excluded.answer_text;
