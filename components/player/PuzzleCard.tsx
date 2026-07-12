import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCardProps = {
  card: ExploredRoomCard;
  index: number;
  total: number;
};

export function PuzzleCard({ card, index, total }: PuzzleCardProps) {
  const label = getResultLabel(card.resultType);

  return (
    <article className="snap-card puzzle-card">
      <div className="card-header">
        <div>
          <p className="kicker">
            {index}/{total} {label}
          </p>
          <h3 className="card-title">部屋 {card.roomCode}</h3>
        </div>
        {card.cleared ? (
          <span className="badge">
            クリア済み
          </span>
        ) : null}
      </div>

      <p className="card-message">
        {card.message}
      </p>

      {card.resultType === "show_puzzle" ? (
        <div className="card-section">
          <h4>{card.title ?? "謎"}</h4>
          <p className="puzzle-text">
            {card.puzzleText ?? "謎文はまだ登録されていません。"}
          </p>
          <div className="image-frame">
            {card.puzzleImageUrl ? (
              <img
                src={card.puzzleImageUrl}
                alt={`${card.title ?? card.roomCode} の謎画像`}
                className="puzzle-image"
              />
            ) : (
              <span className="muted strong">
                画像なし
              </span>
            )}
          </div>
        </div>
      ) : null}

      {card.resultType === "hidden_clue" ? (
        <div className="note-box">
          現地探索型の部屋です。画面には謎本文を表示せず、答えだけを送信できます。
        </div>
      ) : null}
    </article>
  );
}

function getResultLabel(resultType: ExploredRoomCard["resultType"]) {
  switch (resultType) {
    case "not_found":
      return "部屋なし";
    case "hidden_clue":
      return "現地探索型";
    case "show_puzzle":
      return "謎表示";
  }
}
