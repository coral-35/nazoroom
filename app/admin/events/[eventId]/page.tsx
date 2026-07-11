import Link from "next/link";
import { AdminEventControl } from "@/components/admin/AdminEventControl";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getNazoroomService } from "@/lib/server/service";

type AdminEventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { eventId } = await params;
  const service = getNazoroomService();
  const [adminState, dashboard] = await Promise.all([
    service.getAdminEvent(eventId),
    service.getAdminDashboard(eventId)
  ]);

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">管理</p>
          <h1 className="section-title">イベント進行</h1>
          <p className="lead lead--small">イベントID: {eventId}</p>
        </div>
        <div className="admin-header-actions">
          <Link href={`/admin/events/${eventId}/problems`} className="button button--secondary button--compact">
            問題編集
          </Link>
          <Link href={`/events/${eventId}/results`} className="button button--secondary button--compact">
            結果画面
          </Link>
        </div>
      </div>
      <AdminEventControl
        eventId={eventId}
        initialEvent={adminState.event}
        initialMessage={adminState.message}
      />
      <section className="section-gap">
        <AdminDashboard
          apiBasePath={`/api/admin/events/${eventId}`}
          initialDashboard={dashboard}
        />
      </section>
    </main>
  );
}
