import type { TreasureItem } from "@/lib/types/app";

type TreasureListProps = {
  treasures: TreasureItem[];
};

export function TreasureList({ treasures }: TreasureListProps) {
  return (
    <section className="panel panel--tight">
      <div className="panel-header">
        <h2 className="card-title">入手した宝</h2>
        <span className="badge">
          {treasures.length}個
        </span>
      </div>
      {treasures.length === 0 ? (
        <p className="lead lead--small">
          まだ宝を入手していません。
        </p>
      ) : (
        <ul className="item-list">
          {treasures.map((treasure) => (
            <li
              key={treasure.roomCode}
              className="list-card"
            >
              <p className="strong">{treasure.name}</p>
              <p className="muted">部屋 {treasure.roomCode}</p>
              {treasure.description ? (
                <p className="lead lead--small">
                  {treasure.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
