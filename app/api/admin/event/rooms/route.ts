import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError, readJsonObject } from "@/lib/server/route";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export async function GET() {
  try {
    const response = await getNazoroomService().listAdminRooms(DEFAULT_EVENT_ID);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const response = await getNazoroomService().saveAdminRoom(
      DEFAULT_EVENT_ID,
      body
    );

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
