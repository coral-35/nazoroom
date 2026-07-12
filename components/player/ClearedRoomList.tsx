import type { ClearedRoomItem } from "@/lib/types/app";

type ClearedRoomListProps = {
  clearedRooms: ClearedRoomItem[];
};

export function ClearedRoomList({ clearedRooms }: ClearedRoomListProps) {
  const roomCodes = clearedRooms
    .map((room) => room.roomCode)
    .sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));

  return (
    <section className="panel panel--tight cleared-room-panel">
      <div className="panel-header">
        <h2 className="card-title">クリアした部屋</h2>
        <span className="muted">{roomCodes.length}部屋</span>
      </div>
      <p className="cleared-room-codes">
        {roomCodes.length ? roomCodes.join(" / ") : "まだクリアした部屋はありません。"}
      </p>
    </section>
  );
}
