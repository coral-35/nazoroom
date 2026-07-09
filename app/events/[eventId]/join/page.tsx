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
      <JoinForm eventId={eventId} />
    </main>
  );
}
