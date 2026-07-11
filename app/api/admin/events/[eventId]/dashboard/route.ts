import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { getEventId, jsonError, type EventRouteContext } from "@/lib/server/route";

export async function GET(_request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const response = await getNazoroomService().getAdminDashboard(eventId);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
