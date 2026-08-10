"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ContentItem } from "@/lib/content";

type ViewerState =
  | { status: "loading" }
  | { status: "error"; message: string; notFound?: boolean }
  | { status: "ready"; item: ContentItem; html: string };

export default function ContentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/content/${id}`);
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({
            status: "error",
            message: data.error ?? "Failed to load content",
            notFound: response.status === 404,
          });
          return;
        }
        setState({ status: "ready", item: data.item, html: data.html });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Failed to load content" });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
      <Link
        href="/"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Back to gallery
      </Link>

      {state.status === "loading" && (
        <div className="mt-6 flex-1 animate-pulse rounded-xl bg-gray-100" />
      )}

      {state.status === "error" && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 py-20 text-center">
          <p className="text-lg font-medium text-gray-900">
            {state.notFound ? "Content not found" : "Something went wrong"}
          </p>
          <p className="text-sm text-gray-500">{state.message}</p>
          <Link
            href="/"
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to gallery
          </Link>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold capitalize tracking-tight text-gray-900">
                {state.item.title}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Uploaded{" "}
                {new Date(state.item.uploadedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>

          {/*
            Uploaded HTML is arbitrary user content. It is rendered only inside
            a sandboxed iframe (allow-scripts, no allow-same-origin) so its
            scripts run in an opaque origin, isolated from this app.
          */}
          <iframe
            srcDoc={state.html}
            sandbox="allow-scripts"
            title={state.item.title}
            className="mt-6 min-h-[70vh] w-full flex-1 rounded-xl border border-gray-200 bg-white shadow-sm"
          />
        </>
      )}
    </main>
  );
}
