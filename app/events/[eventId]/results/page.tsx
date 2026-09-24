import Link from "next/link";
import { ResultsPanel } from "@/components/player/ResultsPanel";

type ResultsPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = await params;

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="kicker">結果</p>
          <h1 className="section-title">ランキング</h1>
        </div>
        <Link
          href={`/admin/events/${eventId}`}
          className="button button--secondary button--compact"
        >
          管理画面へ
        </Link>
      </div>
      <ResultsPanel eventId={eventId} />
    </main>
  );
}
