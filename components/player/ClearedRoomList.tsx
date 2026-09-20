import { TREASURE_NAMES } from "@/lib/domain/treasures";
import type { ClearedRoomItem } from "@/lib/types/app";

export function ClearedRoomList({ clearedRooms }: { clearedRooms: ClearedRoomItem[] }) {
  const acquired = new Set(clearedRooms.map((room) => room.treasureName));

  return (
    <section className="panel panel--tight treasure-panel" aria-label="ゲットした宝">
      <h2 className="card-title">ゲットした宝</h2>
      <div className="treasure-grid">
        {TREASURE_NAMES.slice(0, 25).map((name) => (
          <div key={name} className="treasure-slot" data-acquired={acquired.has(name)}>
            {acquired.has(name) ? name : null}
          </div>
        ))}
        {acquired.has("宝Z") ? (
          <div className="treasure-slot treasure-secret" data-acquired="true">宝Z</div>
        ) : null}
      </div>
    </section>
  );
}
