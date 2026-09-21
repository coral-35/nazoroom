import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { File } from "node:buffer";
import { createClient } from "@supabase/supabase-js";

const bucket = "puzzle-images";
const puzzlesDir = join(process.cwd(), "public", "puzzles");

loadEnvFile(process.env.PUZZLE_UPLOAD_ENV_FILE ?? ".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const files = (await readdir(puzzlesDir))
  .filter((fileName) => /^frame-\d{2}\.png$/.test(fileName))
  .sort();

for (const fileName of files) {
  const problemNumber = Number(fileName.match(/\d{2}/)?.[0]);
  const filePath = join(puzzlesDir, fileName);
  const objectPath = `initial/${fileName}`;
  const file = new File([readFileSync(filePath)], fileName, { type: "image/png" });

  const { error: uploadError } = await client.storage.from(bucket).upload(objectPath, file, {
    contentType: "image/png",
    upsert: true
  });
  if (uploadError) {
    throw uploadError;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  const { error: updateError } = await client
    .from("problem_bank")
    .update({ puzzle_image_url: data.publicUrl })
    .eq("problem_number", problemNumber);

  if (updateError) {
    throw updateError;
  }

  console.log(`problem ${problemNumber}: ${data.publicUrl}`);
}

function loadEnvFile(fileName) {
  const envPath = join(process.cwd(), fileName);
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] ??= value;
  }
}
