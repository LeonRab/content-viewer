import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  CONTENT_PREFIX,
  MAX_FILE_SIZE_BYTES,
  buildPathname,
  idFromPathname,
  titleFromPathname,
  type ContentItem,
} from "@/lib/content";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: CONTENT_PREFIX });
    const items: ContentItem[] = blobs
      .filter((blob) => blob.pathname.endsWith(".html"))
      .map((blob) => ({
        id: idFromPathname(blob.pathname),
        pathname: blob.pathname,
        title: titleFromPathname(blob.pathname),
        url: blob.url,
        uploadedAt: blob.uploadedAt.toISOString(),
        size: blob.size,
      }))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to list content", error);
    return NextResponse.json(
      { error: "Failed to load content list" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let file: File | null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!/\.html?$/i.test(file.name)) {
    return NextResponse.json(
      { error: "Only .html files are allowed" },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 5 MB)" },
      { status: 400 }
    );
  }

  try {
    const pathname = buildPathname(file.name);
    // addRandomSuffix off: the timestamp already makes the pathname unique,
    // and a predictable pathname is what lets us derive stable /content/[id] URLs.
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: "text/html; charset=utf-8",
    });

    const item: ContentItem = {
      id: idFromPathname(blob.pathname),
      pathname: blob.pathname,
      title: titleFromPathname(blob.pathname),
      url: blob.url,
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload content", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
