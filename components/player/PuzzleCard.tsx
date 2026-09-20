import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCardProps = {
  card?: ExploredRoomCard;
  index?: number;
  total?: number;
  loading?: boolean;
};

export function PuzzleCard({ card, index, total, loading = false }: PuzzleCardProps) {
  return (
    <article className="snap-card puzzle-card" aria-label={card ? `部屋 ${card.roomCode} の謎` : "探索前の謎表示枠"}>
      <div className="card-header">
        <div>
          {index && total ? <p className="kicker">{index}/{total}</p> : null}
          {card ? <h3 className="card-title">部屋 {card.roomCode}</h3> : null}
        </div>
        {card?.cleared ? <span className="badge">クリア済み</span> : null}
      </div>
      <div className="puzzle-media">
        {card?.resultType === "show_puzzle" && card.puzzleImageUrl ? (
          <img
            src={card.puzzleImageUrl}
            alt={`部屋 ${card.roomCode} の謎画像`}
            width={800}
            height={600}
            className="puzzle-image"
          />
        ) : !card ? (
          <p className="muted">{loading ? "探索ログを読み込み中..." : "まだ部屋を探索していません"}</p>
        ) : null}
      </div>
    </article>
  );
}
