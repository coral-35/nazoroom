import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

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

    const response = await getNazoroomService().getState(DEFAULT_EVENT_ID, playerId);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
