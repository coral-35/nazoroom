import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import {
  getEventId,
  jsonError,
  readJsonObject,
  type EventRouteContext
} from "@/lib/server/route";

export async function POST(request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const body = await readJsonObject(request);
    const response = await getNazoroomService().explore(
      eventId,
      typeof body.playerId === "string" ? body.playerId : "",
      body.roomCode
    );

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
