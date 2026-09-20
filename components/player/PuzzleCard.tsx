import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCardProps = {
  card: ExploredRoomCard;
  index?: number;
  total?: number;
};

export function PuzzleCard({ card, index, total }: PuzzleCardProps) {
  return (
    <article className="snap-card puzzle-card" aria-label={`部屋 ${card.roomCode} の謎`}>
      <div className="card-header">
        <div>
          {index && total ? <p className="kicker">{index}/{total}</p> : null}
          <h3 className="card-title">部屋 {card.roomCode}</h3>
        </div>
        {card.cleared ? <span className="badge">クリア済み</span> : null}
      </div>
      {card.resultType === "show_puzzle" ? (
        <>
          {card.puzzleText ? <p className="puzzle-text">{card.puzzleText}</p> : null}
          {card.puzzleImageUrl ? (
            <img
              src={card.puzzleImageUrl}
              alt={`部屋 ${card.roomCode} の謎画像`}
              width={800}
              height={600}
              className="puzzle-image"
            />
          ) : null}
        </>
      ) : null}
    </article>
  );
}
