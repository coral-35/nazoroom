import type { RankingResponse } from "@/lib/types/app";

type RankingTableProps = {
  ranking: RankingResponse | null;
};

export function RankingTable({ ranking }: RankingTableProps) {
  return (
    <section className="rounded-lg border border-[#d8e3df] bg-white p-4">
      <h2 className="text-lg font-bold">ランキング</h2>
      {!ranking ? (
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          集計結果を読み込み中です。
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[24rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#d8e3df] text-left">
                  <th className="py-2 pr-3">順位</th>
                  <th className="py-2 pr-3">名前</th>
                  <th className="py-2 pr-3 text-right">得点</th>
                  <th className="py-2 pr-3">宝</th>
                </tr>
              </thead>
              <tbody>
                {ranking.ranking.map((row, index) => (
                  <tr key={row.playerId} className="border-b border-[#eef3f1]">
                    <td className="py-2 pr-3 font-bold">{index + 1}</td>
                    <td className="py-2 pr-3">{row.nickname}</td>
                    <td className="py-2 pr-3 text-right font-bold">{row.score}</td>
                    <td className="py-2 pr-3">{row.treasures.join("、") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2">
            {ranking.treasureScores.map((score) => (
              <div
                key={score.roomCode}
                className="flex items-center justify-between gap-3 rounded-md bg-[#f9fbfa] px-3 py-2 text-sm"
              >
                <span>
                  {score.treasureName} / 入手 {score.ownerCount}人
                </span>
                <span className="font-bold">{score.score}点</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
