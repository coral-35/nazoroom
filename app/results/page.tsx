import Link from "next/link";
import { ResultsPanel } from "@/components/player/ResultsPanel";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default function ResultsPage() {
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
      <ResultsPanel eventId={DEFAULT_EVENT_ID} apiBasePath="/api/event" />
    </main>
  );
}
