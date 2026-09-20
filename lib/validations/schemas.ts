import { normalizeRoomCode } from "@/lib/domain/normalize";

const ROOM_CODE_PATTERN = /^[0-9]{1,6}$/;

export function parseNickname(input: unknown): string {
  if (typeof input !== "string") {
    throw new ValidationError("ニックネームを入力してください。");
  }

  const nickname = input.trim();
  if (!nickname) {
    throw new ValidationError("ニックネームを入力してください。");
  }
  if (nickname.length > 32) {
    throw new ValidationError("ニックネームは32文字以内で入力してください。");
  }

  return nickname;
}

export function parseRoomCode(input: unknown): string {
  if (typeof input !== "string") {
    throw new ValidationError("部屋番号を入力してください。");
  }

  const normalizedRoomCode = normalizeRoomCode(input);
  if (!normalizedRoomCode) {
    throw new ValidationError("部屋番号を入力してください。");
  }
  if (!ROOM_CODE_PATTERN.test(normalizedRoomCode)) {
    throw new ValidationError("部屋番号は1〜6桁の数字で入力してください。");
  }

  return input.trim();
}

export function parseAnswer(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new ValidationError("解答を入力してください。");
  }

  return input.trim();
}

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
