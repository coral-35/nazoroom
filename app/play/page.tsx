import { PlayerApp } from "@/components/player/PlayerApp";
import { getNazoroomService } from "@/lib/server/service";
import { DEFAULT_EVENT_ID, type StateResponse } from "@/lib/types/app";

type PlayPageProps = {
  searchParams: Promise<{
    playerId?: string;
  }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { playerId } = await searchParams;
  let initialState: StateResponse | null = null;

  if (playerId) {
    try {
      initialState = await getNazoroomService().getState(DEFAULT_EVENT_ID, playerId);
    } catch {
      initialState = null;
    }
  }

  return (
    <PlayerApp
      eventId={DEFAULT_EVENT_ID}
      apiBasePath="/api/event"
      initialPlayerId={playerId ?? null}
      initialState={initialState}
      joinPath="/join"
    />
  );
}
