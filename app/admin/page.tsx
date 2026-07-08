import Link from "next/link";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-8">
      <p className="text-sm font-semibold text-[#008a72]">管理メモ</p>
      <h1 className="mt-2 text-3xl font-bold">MVP 管理用ページ</h1>
      <section className="mt-6 rounded-lg border border-[#d8e3df] bg-white p-5">
        <h2 className="text-lg font-bold">seed データで確認する</h2>
        <p className="mt-2 leading-7 text-neutral-700">
          MVPでは、Supabase migration と seed SQL でイベント・部屋・解答・宝を登録します。
          管理画面の本格CRUDは将来拡張扱いです。
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/join`}
            className="focus-ring rounded-md bg-[#008a72] px-4 py-3 text-center font-semibold text-white"
          >
            プレイヤー画面
          </Link>
          <Link
            href={`/events/${DEFAULT_EVENT_ID}/results`}
            className="focus-ring rounded-md border border-[#d8e3df] px-4 py-3 text-center font-semibold"
          >
            結果画面
          </Link>
        </div>
      </section>
    </main>
  );
}
