import { PlayerApp } from "@/components/player/PlayerApp";

type PlayPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { eventId } = await params;
  return <PlayerApp eventId={eventId} />;
}
