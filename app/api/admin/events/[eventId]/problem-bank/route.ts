import { NextResponse } from "next/server";
import { readProblemPayload } from "@/lib/server/problemImageUpload";
import { getNazoroomService } from "@/lib/server/service";
import {
  getEventId,
  jsonError,
  type EventRouteContext
} from "@/lib/server/route";

export async function POST(request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const body = await readProblemPayload(request);
    const response = await getNazoroomService().saveAdminProblem(eventId, body);

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
