# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Markdown Preview Workspace built with Next.js App Router. Features a three-panel layout (document list, editor, live preview) with automatic save to SQLite database.

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: better-sqlite3 (local SQLite with WAL mode)
- **Markdown**: react-markdown + remark-gfm
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm add better-sqlite3 react-markdown remark-gfm

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

Development server runs on `http://localhost:3000`

## Architecture

### Data Layer (`lib/db.ts`)
- Single-table SQLite schema stored in `data/markdown.db`
- Database is cached in `globalThis` to avoid re-initialization in development
- CRUD functions: `listDocs()`, `getDocById()`, `createDoc()`, `updateDoc()`
- `ensureSeedDoc()` creates a welcome document if database is empty
- Column naming: `snake_case` in DB, `camelCase` in TypeScript

### API Routes
- `GET/POST /api/docs` (app/api/docs/route.ts)
  - GET: returns `{ data: Doc[] }` - all docs sorted by `updated_at DESC`
  - POST: creates new doc, returns `{ data: Doc }` with status 201
- `GET/PATCH /api/docs/[id]` (app/api/docs/[id]/route.ts)
  - GET: returns single doc or 404
  - PATCH: updates title/content, validates at least one field provided

Both routes set `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.

### Frontend (app/page.tsx)
Client-side component with complex state management:

**State Pattern**:
- `docs`: array of all documents
- `activeDocId`: currently selected document
- `saveState`: "idle" | "saving" | "saved" | "error"
- `syncedSignaturesRef`: Map of `docId -> signatureOf(doc)` to track unsaved changes

**Auto-save Mechanism**:
- Changes trigger 800ms debounce timer
- Uses `signatureOf(doc)` function to detect actual changes (title + content)
- Documents are re-sorted by `updated_at` after save
- Manual save button cancels debounce and saves immediately

**Type Guards**:
- `isDoc()` and `isDocArray()` validate API responses
- Always validate unknown data before using

**Mobile Support**:
- `mobilePane` state toggles between "editor" and "preview" views
- Responsive CSS handles visibility with `.is-visible` class

### Theme System (app/page.tsx, lines 74-144)
Custom theme sync for Next.js dev tools:
- Detects theme from `<nextjs-portal>` element classList
- Falls back to `prefers-color-scheme` media query
- Sets `data-theme` attribute on `<html>` for CSS selectors

### Styling
- Font variables: `--font-body` (IBM Plex Sans), `--font-mono` (IBM Plex Mono), `--font-display` (Playfair Display)
- Three-column responsive layout using flexbox
- Dark/light theme via `[data-theme]` attribute selector
- `.gitignore` excludes `/data/*.db` and related WAL files

## Key Conventions

- **Path alias**: `@/*` maps to project root (configured in tsconfig.json)
- **TypeScript strict mode** is enabled
- All API responses use `{ data: T }` wrapper format
- Error responses use `{ error: string }` format
- Date/time stored as ISO 8601 strings in SQLite
- Default new doc: title="Untitled note", content="# New note..."
