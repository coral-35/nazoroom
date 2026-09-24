import { PlayerApp } from "@/components/player/PlayerApp";
import { getNazoroomService } from "@/lib/server/service";
import type { StateResponse } from "@/lib/types/app";

export const dynamic = "force-dynamic";

type PlayPageProps = {
  searchParams: Promise<{
    playerId?: string;
  }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { playerId } = await searchParams;
  const service = getNazoroomService();
  const event = await service.getCurrentEvent();
  let initialState: StateResponse | null = null;

  if (playerId) {
    try {
      initialState = await service.getState(event.id, playerId);
    } catch {
      initialState = null;
    }
  }

  return (
    <PlayerApp
      eventId={event.id}
      apiBasePath="/api/event"
      initialPlayerId={playerId ?? null}
      initialState={initialState}
      joinPath="/join"
      playPath="/play"
    />
  );
}
