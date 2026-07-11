export type LocalStartRecord = {
  signal: string;
  receivedAt: number;
};

export function parseLocalStart(value: string | null): LocalStartRecord | null {
  try {
    const parsed = JSON.parse(value ?? "null") as {
      signal?: unknown;
      receivedAt?: unknown;
    } | null;

    return parsed &&
      typeof parsed.signal === "string" &&
      typeof parsed.receivedAt === "number"
      ? { signal: parsed.signal, receivedAt: parsed.receivedAt }
      : null;
  } catch {
    return null;
  }
}

export function calculateLocalDeadline(receivedAt: number, durationMinutes: number) {
  return receivedAt + durationMinutes * 60_000;
}
