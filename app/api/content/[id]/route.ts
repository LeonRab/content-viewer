import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  idFromPathname,
  isValidId,
  pathnameFromId,
  titleFromPathname,
} from "@/lib/content";

async function findBlob(id: string) {
  const pathname = pathnameFromId(id);
  const { blobs } = await list({ prefix: pathname });
  return blobs.find((blob) => blob.pathname === pathname) ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  try {
    const blob = await findBlob(id);
    if (!blob) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const response = await fetch(blob.url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 502 }
      );
    }
    const html = await response.text();

    return NextResponse.json({
      item: {
        id: idFromPathname(blob.pathname),
        pathname: blob.pathname,
        title: titleFromPathname(blob.pathname),
        url: blob.url,
        uploadedAt: blob.uploadedAt.toISOString(),
        size: blob.size,
      },
      html,
    });
  } catch (error) {
    console.error("Failed to load content", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  try {
    const blob = await findBlob(id);
    if (!blob) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    await del(blob.url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete content", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
