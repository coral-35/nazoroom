import Link from "next/link";
import { AdminRoomEditor } from "@/components/admin/AdminRoomEditor";
import { getNazoroomService } from "@/lib/server/service";

type AdminProblemsPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function AdminProblemsPage({ params }: AdminProblemsPageProps) {
  const { eventId } = await params;
  const rooms = await getNazoroomService().listAdminRooms(eventId);

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">管理</p>
          <h1 className="page-title">問題・解答編集</h1>
        </div>
        <Link href={`/admin/events/${eventId}`} className="button button--secondary button--compact">
          進行画面へ
        </Link>
      </div>
      <AdminRoomEditor eventId={eventId} initialRooms={rooms.rooms} />
    </main>
  );
}
