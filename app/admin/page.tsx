import Link from "next/link";
import { AdminEventControl } from "@/components/admin/AdminEventControl";
import { getNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default async function AdminPage() {
  const adminState = await getNazoroomService().getAdminEvent(DEFAULT_EVENT_ID);

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">管理</p>
          <h1 className="page-title">MVP 管理用ページ</h1>
        </div>
        <Link href="/results" className="button button--secondary button--compact">
          結果画面
        </Link>
      </div>
      <section className="panel section-gap">
        <h2 className="card-title">seed データで確認する</h2>
        <p className="lead">
          イベント進行ページを直接開き、探索開始、終了、結果発表、リセットを管理します。
        </p>
        <div className="button-grid">
          <Link href="/join" className="button button--secondary">
            プレイヤー画面
          </Link>
        </div>
      </section>
      <section className="section-gap">
        <AdminEventControl
          eventId={DEFAULT_EVENT_ID}
          apiBasePath="/api/admin/event"
          initialEvent={adminState.event}
          initialMessage={adminState.message}
        />
      </section>
    </main>
  );
}
