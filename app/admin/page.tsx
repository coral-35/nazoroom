import Link from "next/link";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default function AdminPage() {
  return (
    <main className="page-shell page-shell--wide">
      <p className="kicker">管理メモ</p>
      <h1 className="page-title">MVP 管理用ページ</h1>
      <section className="panel section-gap">
        <h2 className="card-title">seed データで確認する</h2>
        <p className="lead">
          イベント進行ページを直接開き、探索開始、終了、結果発表、リセットを管理します。
          部屋・解答・宝の登録は Supabase migration と seed SQL で行います。
        </p>
        <div className="button-grid">
          <Link
            href={`/admin/events/${DEFAULT_EVENT_ID}`}
            className="button button--primary"
          >
            進行管理
          </Link>
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/join`}
            className="button button--secondary"
          >
            プレイヤー画面
          </Link>
        </div>
      </section>
    </main>
  );
}
