const PLAYER_CACHE_PREFIX = "nazoroom.player.";
const LAST_EVENT_KEY = "nazoroom.player.lastEventId";

export type CachedPlayer = {
  eventId: string;
  playerId: string;
};

export function cachePlayer(eventId: string, playerId: string) {
  localStorage.setItem(playerCacheKey(eventId), playerId);
  localStorage.setItem(LAST_EVENT_KEY, eventId);
}

export function findCachedPlayer(preferredEventId: string): CachedPlayer | null {
  const preferredPlayerId = localStorage.getItem(playerCacheKey(preferredEventId));
  if (preferredPlayerId) {
    return { eventId: preferredEventId, playerId: preferredPlayerId };
  }

  const lastEventId = localStorage.getItem(LAST_EVENT_KEY);
  if (lastEventId) {
    const lastPlayerId = localStorage.getItem(playerCacheKey(lastEventId));
    if (lastPlayerId) {
      return { eventId: lastEventId, playerId: lastPlayerId };
    }
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(PLAYER_CACHE_PREFIX) || key === LAST_EVENT_KEY) {
      continue;
    }

    const eventId = key.slice(PLAYER_CACHE_PREFIX.length);
    const playerId = localStorage.getItem(key);
    if (eventId && playerId) {
      return { eventId, playerId };
    }
  }

  return null;
}

export function playerCacheKey(eventId: string) {
  return `${PLAYER_CACHE_PREFIX}${eventId}`;
}

export function playPathForCachedPlayer(
  cachedPlayer: CachedPlayer,
  currentEventId: string,
  currentPlayPath: string
) {
  const targetPath =
    cachedPlayer.eventId === currentEventId
      ? currentPlayPath
      : `/events/${cachedPlayer.eventId}/play`;

  return `${targetPath}?playerId=${encodeURIComponent(cachedPlayer.playerId)}`;
}
