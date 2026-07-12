with ranked_exploration_logs as (
  select
    id,
    row_number() over (
      partition by player_id, room_id
      order by created_at, id
    ) as duplicate_order
  from public.exploration_logs
  where room_id is not null
)
delete from public.exploration_logs
where id in (
  select id
  from ranked_exploration_logs
  where duplicate_order > 1
);

alter table public.exploration_logs
add constraint exploration_logs_player_room_key
unique (player_id, room_id);
