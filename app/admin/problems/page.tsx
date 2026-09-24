import Link from "next/link";
import { AdminRoomEditor } from "@/components/admin/AdminRoomEditor";
import { getNazoroomService } from "@/lib/server/service";

export const dynamic = "force-dynamic";

export default async function AdminProblemsPage() {
  const service = getNazoroomService();
  const event = await service.getCurrentEvent();
  const rooms = await service.listAdminRooms(event.id);

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">管理</p>
          <h1 className="page-title">問題・解答編集</h1>
        </div>
        <Link href="/admin" className="button button--secondary button--compact">
          進行画面へ
        </Link>
      </div>
      <AdminRoomEditor
        eventId={event.id}
        apiBasePath="/api/admin/event"
        initialRooms={rooms.rooms}
        initialProblems={rooms.problems}
      />
    </main>
  );
}
