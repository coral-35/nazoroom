import Link from "next/link";
import { JoinForm } from "@/components/player/JoinForm";

type JoinPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { eventId } = await params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-5 py-8">
      <div>
        <Link href="/" className="text-sm font-semibold text-[#006c5b]">
          トップへ
        </Link>
        <h1 className="mt-3 text-3xl font-bold">参加する</h1>
        <p className="mt-2 leading-7 text-neutral-700">
          ニックネームを登録すると、探索画面に進みます。
        </p>
      </div>
      <JoinForm eventId={eventId} />
    </main>
  );
}
