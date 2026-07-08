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
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#008a72]">結果</p>
          <h1 className="text-2xl font-bold">ランキング</h1>
        </div>
        <Link
          href={`/events/${eventId}/join`}
          className="focus-ring rounded-md border border-[#d8e3df] px-3 py-2 text-sm font-semibold"
        >
          参加へ
        </Link>
      </div>
      <ResultsPanel eventId={eventId} />
    </main>
  );
}
