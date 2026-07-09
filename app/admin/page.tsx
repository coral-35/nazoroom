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
          MVPでは、Supabase migration と seed SQL でイベント・部屋・解答・宝を登録します。
          管理画面の本格CRUDは将来拡張扱いです。
        </p>
        <div className="button-grid">
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/join`}
            className="button button--primary"
          >
            プレイヤー画面
          </Link>
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/results`}
            className="button button--secondary"
          >
            結果画面
          </Link>
        </div>
      </section>
    </main>
  );
}
