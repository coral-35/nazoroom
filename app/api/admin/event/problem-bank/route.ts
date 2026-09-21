import { NextResponse } from "next/server";
import { readProblemPayload } from "@/lib/server/problemImageUpload";
import { getNazoroomService } from "@/lib/server/service";
import { jsonError } from "@/lib/server/route";
import { DEFAULT_EVENT_ID } from "@/lib/types/app";

export async function POST(request: Request) {
  try {
    const body = await readProblemPayload(request);
    const response = await getNazoroomService().saveAdminProblem(DEFAULT_EVENT_ID, body);

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
