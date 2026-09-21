import { AppError } from "@/lib/server/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PUZZLE_IMAGE_BUCKET = "puzzle-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

export async function readProblemPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const text = await request.text();
    if (!text.trim()) {
      return {};
    }

    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  }

  const formData = await request.formData();
  const id = formData.get("id");
  const roomCode = formData.get("roomCode");
  const puzzleImageUrl = formData.get("puzzleImageUrl");
  const answers = formData.get("answers");
  const image = formData.get("image");

  if (typeof id !== "string") {
    throw new AppError("問題の入力内容を確認してください。", 400);
  }

  const uploadedImageUrl =
    image instanceof File && image.size > 0
      ? await uploadPuzzleImage(id, image)
      : null;

  return {
    id,
    roomCode,
    puzzleImageUrl: uploadedImageUrl ?? puzzleImageUrl,
    answers
  };
}

async function uploadPuzzleImage(problemId: string, image: File) {
  const extension = IMAGE_EXTENSIONS.get(image.type);
  if (!extension) {
    throw new AppError("画像はPNG、JPEG、WebP、GIFのいずれかを選択してください。", 400);
  }
  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError("画像は5MB以内で選択してください。", 400);
  }

  const client = createSupabaseAdminClient();
  const objectPath = `problems/${problemId}/${Date.now()}.${extension}`;
  const { error } = await client.storage
    .from(PUZZLE_IMAGE_BUCKET)
    .upload(objectPath, image, {
      contentType: image.type,
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(PUZZLE_IMAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
