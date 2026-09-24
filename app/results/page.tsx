import Link from "next/link";
import { ResultsPanel } from "@/components/player/ResultsPanel";
import { getNazoroomService } from "@/lib/server/service";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const event = await getNazoroomService().getCurrentEvent();

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">結果</p>
          <h1 className="section-title">ランキング</h1>
        </div>
        <Link href="/join" className="button button--secondary button--compact">
          参加へ
        </Link>
      </div>
      <ResultsPanel eventId={event.id} apiBasePath="/api/event" />
    </main>
  );
}
