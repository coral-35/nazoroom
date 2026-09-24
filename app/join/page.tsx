import { JoinForm } from "@/components/player/JoinForm";
import { getNazoroomService } from "@/lib/server/service";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const event = await getNazoroomService().getCurrentEvent();

  return (
    <main className="page-shell page-shell--center">
      <div>
        <p className="kicker">謎解きダンジョン</p>
        <h1 className="page-title">参加する</h1>
        <p className="lead">
          ニックネームを登録すると、探索画面に進みます。
        </p>
      </div>
      <JoinForm
        eventId={event.id}
        apiBasePath="/api/event"
        playPath="/play"
      />
    </main>
  );
}
