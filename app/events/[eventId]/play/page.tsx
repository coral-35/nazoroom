import { PlayerApp } from "@/components/player/PlayerApp";
import { getNazoroomService } from "@/lib/server/service";
import type { StateResponse } from "@/lib/types/app";

type PlayPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<{
    playerId?: string;
  }>;
};

export default async function PlayPage({ params, searchParams }: PlayPageProps) {
  const { eventId } = await params;
  const { playerId } = await searchParams;
  let initialState: StateResponse | null = null;

  if (playerId) {
    try {
      initialState = await getNazoroomService().getState(eventId, playerId);
    } catch {
      initialState = null;
    }
  }

  return (
    <PlayerApp
      eventId={eventId}
      initialPlayerId={playerId ?? null}
      initialState={initialState}
    />
  );
}
