import { NextResponse } from "next/server";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const service = getNazoroomService();
    const event = await service.getCurrentEvent();
    const response = await service.saveAdminAssignments(event.id, body);

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
