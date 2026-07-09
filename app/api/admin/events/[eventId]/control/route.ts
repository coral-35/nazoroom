import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import {
  getEventId,
  jsonError,
  readJsonObject,
  type EventRouteContext
} from "@/lib/server/route";
import type { EventControlAction } from "@/lib/types/app";

const actions = new Set<EventControlAction>([
  "start_exploration",
  "close_exploration",
  "publish_results",
  "reset"
]);

export async function POST(request: Request, context: EventRouteContext) {
  try {
    const eventId = await getEventId(context);
    const body = await readJsonObject(request);
    const action = body.action;

    if (typeof action !== "string" || !actions.has(action as EventControlAction)) {
      return NextResponse.json(
        { message: "管理操作を選択してください。" },
        { status: 400 }
      );
    }

    const response = await getNazoroomService().controlEvent(
      eventId,
      action as EventControlAction,
      body.durationMinutes
    );

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
