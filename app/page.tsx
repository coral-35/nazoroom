import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell page-shell--center">
      <section className="panel">
        <p className="kicker">MVPテストイベント</p>
        <h1 className="page-title">謎解き宝探し</h1>
        <p className="lead">
          部屋番号を探索し、見つけた謎を解いて宝を集めるプレイヤー用アプリです。
        </p>
        <div className="action-stack">
          <Link href="/join" className="button button--primary">
            テストイベントに参加
          </Link>
          <Link href="/results" className="button button--secondary">
            ランキングを見る
          </Link>
        </div>
      </section>
    </main>
  );
}
