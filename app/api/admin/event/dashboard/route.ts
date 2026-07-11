import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export async function GET() {
  try {
    const response = await getNazoroomService().getAdminDashboard(DEFAULT_EVENT_ID);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
