import { NextResponse } from "next/server";
import { AppError } from "@/lib/server/errors";
import { ValidationError } from "@/lib/validations/schemas";

export type EventRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function getEventId(context: EventRouteContext): Promise<string> {
  const params = await context.params;
  return params.eventId;
}

export function jsonError(error: unknown) {
  if (error instanceof ValidationError || error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { message: "通信に失敗しました。時間をおいて再試行してください。" },
    { status: 500 }
  );
}
