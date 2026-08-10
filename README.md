# Content Viewer

A public gallery for uploading, browsing, and sharing interactive HTML files.

## Architecture

```
Browser → Next.js frontend → Next.js Route Handlers → Vercel Blob
```

- **Vercel Blob is the source of truth** — no database. Files are stored under
  `content/<timestamp>-<safe-name>.html` and the listing is generated from blob
  metadata.
- **IDs are derived from pathnames** (`<timestamp>-<safe-name>`), so
  `/content/[id]` URLs are stable and shareable.
- **Uploaded HTML is untrusted** — it is rendered only inside a sandboxed
  iframe (`sandbox="allow-scripts"`, no `allow-same-origin`), never injected
  into the React DOM.

## Key files

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Gallery: list, search, empty/loading/error states |
| `app/content/[id]/page.tsx` | Viewer: sandboxed iframe, copy link |
| `app/api/content/route.ts` | `GET` list blobs, `POST` upload with validation |
| `app/api/content/[id]/route.ts` | `GET` resolve blob + fetch HTML, `DELETE` |
| `components/UploadModal.tsx` | Upload modal with drag-and-drop + validation |
| `lib/content.ts` | Shared types, pathname/id/title helpers, limits |
| `examples/weather-demo.html` | Self-contained sample file for testing |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in BLOB_READ_WRITE_TOKEN
npm run dev
```

## Connect Vercel Blob

1. In the [Vercel dashboard](https://vercel.com/dashboard), open your project →
   **Storage** → **Create Database** → **Blob**.
2. Connect the store to the project. Vercel injects `BLOB_READ_WRITE_TOKEN`
   into deployments automatically.
3. For local development, copy the token into `.env.local`, or run
   `vercel env pull .env.local` after `vercel link`.

## Deploy

```bash
npm i -g vercel   # if needed
vercel            # link + preview deploy
vercel --prod     # production deploy
```

Or push the repo to GitHub and import it in the Vercel dashboard — no special
build configuration is needed. Just make sure a Blob store is connected before
uploading.

## Testing the flow

Upload `examples/weather-demo.html` via the **+ Upload** button. It renders
styled weather cards and has a button that proves JavaScript executes inside
the sandbox.
