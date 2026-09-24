import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "space";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`[upload] File: ${file.name}, size: ${file.size}, folder: ${folder}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Абсолютный путь к storage backend
    const storagePath = join("/var/www/ai-astrolog1/backend/storage/app/public", folder);
    await mkdir(storagePath, { recursive: true });

    const filePath = join(storagePath, file.name);
    console.log(`[upload] Writing to: ${filePath}`);
    
    await writeFile(filePath, buffer);
    console.log(`[upload] Success: ${filePath}`);

    const url = `/storage/${folder}/${file.name}`;
    return NextResponse.json({ success: true, url, path: filePath });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: `Upload failed: ${error}` }, { status: 500 });
  }
}
