import Link from "next/link";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-8">
      <section className="rounded-lg border border-[#d8e3df] bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-[#008a72]">MVPテストイベント</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">謎解き宝探し</h1>
        <p className="mt-3 leading-7 text-neutral-700">
          部屋番号を探索し、見つけた謎を解いて宝を集めるプレイヤー用アプリです。
        </p>
        <div className="mt-6 grid gap-3">
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/join`}
            className="focus-ring rounded-md bg-[#008a72] px-4 py-3 text-center font-semibold text-white"
          >
            テストイベントに参加
          </Link>
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/results`}
            className="focus-ring rounded-md border border-[#d8e3df] px-4 py-3 text-center font-semibold"
          >
            ランキングを見る
          </Link>
        </div>
      </section>
    </main>
  );
}
