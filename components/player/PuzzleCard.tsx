import type { ExploredRoomCard } from "@/lib/types/app";

type PuzzleCardProps = {
  card: ExploredRoomCard;
  index: number;
  total: number;
};

export function PuzzleCard({ card, index, total }: PuzzleCardProps) {
  const label = getResultLabel(card.resultType);

  return (
    <article className="snap-card min-h-[300px] w-[88%] min-w-[88%] rounded-lg border border-[#d8e3df] bg-[#f9fbfa] p-4 sm:w-[24rem] sm:min-w-[24rem]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#008a72]">
            {index}/{total} {label}
          </p>
          <h3 className="mt-1 text-xl font-bold">部屋 {card.roomCode}</h3>
        </div>
        {card.unlocked ? (
          <span className="rounded-md bg-[#e9f6f2] px-2 py-1 text-xs font-bold text-[#006c5b]">
            解錠済み
          </span>
        ) : null}
      </div>

      <p className="mt-4 min-h-[3.5rem] whitespace-pre-wrap leading-7 text-neutral-800">
        {card.message}
      </p>

      {card.resultType === "show_puzzle" ? (
        <div className="mt-4">
          <h4 className="text-base font-bold">{card.title ?? "謎"}</h4>
          <p className="mt-2 min-h-[4rem] whitespace-pre-wrap leading-7 text-neutral-800">
            {card.puzzleText ?? "謎文はまだ登録されていません。"}
          </p>
          <div className="mt-3 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-md border border-dashed border-[#9bb4ad] bg-white">
            {card.puzzleImageUrl ? (
              <img
                src={card.puzzleImageUrl}
                alt={`${card.title ?? card.roomCode} の謎画像`}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-semibold text-neutral-500">
                画像なし
              </span>
            )}
          </div>
        </div>
      ) : null}

      {card.resultType === "hidden_clue" ? (
        <div className="mt-4 rounded-md border border-[#d8e3df] bg-white p-3 text-sm leading-6 text-neutral-700">
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
