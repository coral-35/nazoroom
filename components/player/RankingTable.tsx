import type { RankingResponse } from "@/lib/types/app";

type RankingTableProps = {
  ranking: RankingResponse | null;
};

export function RankingTable({ ranking }: RankingTableProps) {
  return (
    <section className="panel panel--tight">
      <h2 className="card-title">ランキング</h2>
      {!ranking ? (
        <p className="lead lead--small">
          集計結果を読み込み中です。
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>順位</th>
                  <th>名前</th>
                  <th className="text-right">得点</th>
                  <th>宝</th>
                </tr>
              </thead>
              <tbody>
                {ranking.ranking.map((row, index) => (
                  <tr key={row.playerId}>
                    <td className="strong">{index + 1}</td>
                    <td>{row.nickname}</td>
                    <td className="text-right strong">{row.score}</td>
                    <td>{row.treasures.join("、") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="score-list">
            {ranking.treasureScores.map((score) => (
              <div
                key={score.roomCode}
                className="score-row"
              >
                <span>
                  {score.treasureName} / 入手 {score.ownerCount}人
                </span>
                <span className="strong">{score.score}点</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
