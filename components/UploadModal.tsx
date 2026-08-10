"use client";

import { useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES, type ContentItem } from "@/lib/content";

type UploadModalProps = {
  onClose: () => void;
  onUploaded: (item: ContentItem) => void;
};

type Mode = "file" | "paste";

function validateFile(file: File): string | null {
  if (!/\.html?$/i.test(file.name)) return "Only .html files are allowed.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File is too large (max 5 MB).";
  return null;
}

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [pastedName, setPastedName] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function selectFile(selected: File | null) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  /** Build the File to upload from the active mode, or return an error. */
  function resolveUpload(): { file: File } | { error: string } {
    if (mode === "file") {
      if (!file) return { error: "Choose a file first." };
      return { file };
    }
    const name = pastedName.trim();
    if (!name) return { error: "Give the content a name." };
    if (!pastedHtml.trim()) return { error: "Paste some HTML content." };
    const pastedFile = new File([pastedHtml], `${name}.html`, {
      type: "text/html",
    });
    if (pastedFile.size > MAX_FILE_SIZE_BYTES) {
      return { error: "Content is too large (max 5 MB)." };
    }
    return { file: pastedFile };
  }

  async function handleUpload() {
    if (uploading) return;
    const resolved = resolveUpload();
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", resolved.file);
      const response = await fetch("/api/content", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      onUploaded(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  const canSubmit =
    mode === "file"
      ? file !== null
      : pastedName.trim() !== "" && pastedHtml.trim() !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upload HTML</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
          {(
            [
              ["file", "Choose file"],
              ["paste", "Paste HTML"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => switchMode(value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "file" ? (
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files[0] ?? null);
            }}
          >
            <span className="text-3xl">📄</span>
            {file ? (
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  Drop an .html file here or click to browse
                </p>
                <p className="text-xs text-gray-500">Max 5 MB</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name, e.g. weather dashboard"
              value={pastedName}
              onChange={(event) => {
                setPastedName(event.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              placeholder="<!DOCTYPE html> ... paste your HTML here"
              value={pastedHtml}
              onChange={(event) => {
                setPastedHtml(event.target.value);
                setError(null);
              }}
              rows={8}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!canSubmit || uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
