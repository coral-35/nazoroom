import { redirect } from "next/navigation";

type EventPlayerAliasPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventPlayerAliasPage({
  params
}: EventPlayerAliasPageProps) {
  const { eventId } = await params;
  redirect(`/events/${eventId}/join`);
}
