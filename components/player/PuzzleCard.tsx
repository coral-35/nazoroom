import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCardProps = {
  card: ExploredRoomCard;
  index?: number;
  total?: number;
};

export function PuzzleCard({ card }: PuzzleCardProps) {
  if (card.resultType !== "show_puzzle" || (!card.puzzleText && !card.puzzleImageUrl)) {
    return null;
  }

  return (
    <article className="compact-puzzle" aria-label={`部屋 ${card.roomCode} の謎`}>
      {card.puzzleText ? <p className="puzzle-text">{card.puzzleText}</p> : null}
      {card.puzzleImageUrl ? (
        <img src={card.puzzleImageUrl} alt={`部屋 ${card.roomCode} の謎画像`} className="puzzle-image" />
      ) : null}
    </article>
  );
}
