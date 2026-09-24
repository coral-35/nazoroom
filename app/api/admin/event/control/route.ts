import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError, readJsonObject } from "@/lib/server/route";
import type { EventControlAction } from "@/lib/types/app";

const actions = new Set<EventControlAction>([
  "start_exploration",
  "close_exploration",
  "publish_results",
  "reset"
]);

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const action = body.action;

    if (typeof action !== "string" || !actions.has(action as EventControlAction)) {
      return NextResponse.json(
        { message: "管理操作を選択してください。" },
        { status: 400 }
      );
    }

    const service = getNazoroomService();
    const event = await service.getCurrentEvent();
    const response = await service.controlEvent(
      event.id,
      action as EventControlAction,
      body.durationMinutes
    );

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
