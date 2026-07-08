import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { getEventId, jsonError, type EventRouteContext } from "@/lib/server/route";

export async function GET(request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json(
        { message: "参加情報が確認できません。再参加してください。" },
        { status: 400 }
      );
    }

    const response = await getNazoroomService().getState(eventId, playerId);

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
