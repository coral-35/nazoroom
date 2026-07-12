alter table public.rooms
drop column if exists treasure_name,
drop column if exists treasure_description;

alter table public.player_treasures
rename to player_cleared_rooms;

alter table public.player_cleared_rooms
rename column unlocked_at to cleared_at;

alter table public.player_cleared_rooms
drop column if exists treasure_name;

alter index if exists player_treasures_event_idx
rename to player_cleared_rooms_event_idx;

alter table public.unlock_attempts
rename to answer_attempts;

alter table public.answer_attempts
drop constraint if exists unlock_attempts_result_check;

update public.answer_attempts
set result = 'already_cleared'
where result = 'already_unlocked';

alter table public.answer_attempts
add constraint answer_attempts_result_check check (
  result in (
    'correct',
    'incorrect',
    'expired',
    'already_cleared',
    'room_not_found'
  )
);

alter index if exists unlock_attempts_player_idx
rename to answer_attempts_player_idx;

update public.events
set title = '謎解きダンジョン'
where title = 'MVPテスト宝探し';
