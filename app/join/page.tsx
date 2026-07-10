import Link from "next/link";
import { JoinForm } from "@/components/player/JoinForm";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default function JoinPage() {
  return (
    <main className="page-shell page-shell--center">
      <div>
        <Link href="/" className="text-link">
          トップへ
        </Link>
        <h1 className="page-title">参加する</h1>
        <p className="lead">
          ニックネームを登録すると、探索画面に進みます。
        </p>
      </div>
      <JoinForm
        eventId={DEFAULT_EVENT_ID}
        apiBasePath="/api/event"
        playPath="/play"
      />
    </main>
  );
}
