"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UploadModal from "@/components/UploadModal";
import type { ContentItem } from "@/lib/content";

async function fetchItems(): Promise<ContentItem[]> {
  const response = await fetch("/api/content");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Failed to load content");
  return data.items;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GalleryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function loadContent() {
    setLoading(true);
    setError(null);
    fetchItems()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load content")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetchItems()
      .then((loaded) => {
        if (!cancelled) setItems(loaded);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load content"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.pathname.toLowerCase().includes(query)
    );
  }, [items, search]);

  function handleUploaded(item: ContentItem) {
    setItems((previous) => [item, ...previous]);
    setShowUpload(false);
    setToast(`Uploaded "${item.title}"`);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Content Viewer
        </h1>
        <p className="mt-1 text-gray-500">
          Browse and share interactive HTML content
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
          />
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Upload
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadContent}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <span className="text-4xl">🗂️</span>
          <div>
            <p className="text-lg font-medium text-gray-900">No content yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first HTML file to get started.
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Upload HTML
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          No content matches &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold capitalize text-gray-900 group-hover:text-blue-600">
                    {item.title}
                  </h2>
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    HTML
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(item.uploadedAt)}
                </p>
              </div>
              <span className="mt-4 text-sm font-medium text-blue-600 group-hover:underline">
                View →
              </span>
            </Link>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
