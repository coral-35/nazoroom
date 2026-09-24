import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json(
        { message: "参加情報が確認できません。再参加してください。" },
        { status: 400 }
      );
    }

    const service = getNazoroomService();
    const event = await service.getCurrentEvent();
    const response = await service.getState(event.id, playerId);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
