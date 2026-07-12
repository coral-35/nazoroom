import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell page-shell--center">
      <section className="panel">
        <p className="kicker">ROOM QUEST</p>
        <h1 className="page-title">謎解きダンジョン</h1>
        <p className="lead">
          部屋番号を探索し、ダンジョンに隠された謎を解いて全室クリアを目指そう。
        </p>
        <div className="action-stack">
          <Link href="/join" className="button button--primary">
            ダンジョンに参加
          </Link>
          <Link href="/results" className="button button--secondary">
            ランキングを見る
          </Link>
        </div>
      </section>
    </main>
  );
}
