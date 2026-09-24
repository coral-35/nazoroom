import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError, readJsonObject } from "@/lib/server/route";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const service = getNazoroomService();
    const event = await service.getCurrentEvent();
    const response = await service.answer(
      event.id,
      String(body.playerId ?? ""),
      body.roomCode,
      body.answer
    );

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
