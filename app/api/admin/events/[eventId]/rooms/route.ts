import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import {
  getEventId,
  jsonError,
  readJsonObject,
  type EventRouteContext
} from "@/lib/server/route";

export async function GET(_request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const response = await getNazoroomService().listAdminRooms(eventId);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const body = await readJsonObject(request);
    const response = await getNazoroomService().saveAdminRoom(eventId, body);

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
