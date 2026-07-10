import Link from "next/link";
import { AdminEventControl } from "@/components/admin/AdminEventControl";
import { AdminRoomEditor } from "@/components/admin/AdminRoomEditor";
import { getNazoroomService } from "@/lib/server/service";

type AdminEventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { eventId } = await params;
  const service = getNazoroomService();
  const [adminState, adminRooms] = await Promise.all([
    service.getAdminEvent(eventId),
    service.listAdminRooms(eventId)
  ]);

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">管理</p>
          <h1 className="section-title">イベント進行</h1>
          <p className="lead lead--small">イベントID: {eventId}</p>
        </div>
        <Link
          href={`/events/${eventId}/results`}
          className="button button--secondary button--compact"
        >
          結果画面
        </Link>
      </div>
      <AdminEventControl
        eventId={eventId}
        initialEvent={adminState.event}
        initialMessage={adminState.message}
      />
      <AdminRoomEditor eventId={eventId} initialRooms={adminRooms.rooms} />
    </main>
  );
}
