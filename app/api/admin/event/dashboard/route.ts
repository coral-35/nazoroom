import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";

export async function GET() {
  try {
    const service = getNazoroomService();
    const event = await service.getCurrentEvent();
    const response = await service.getAdminDashboard(event.id);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
