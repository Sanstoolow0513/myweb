# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Sanstoolow 小站" is a personal site built with Next.js App Router, featuring three main sections:

1. **首页** (`/`) - Site entry point with navigation to Blog and Workspace
2. **Blog** (`/blog`) - Static display page for articles and notes
3. **Workspace** (`/workspace`) - Markdown editor with three-panel layout (document list, editor, live preview) with auto-save to SQLite

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: better-sqlite3 (local SQLite with WAL mode)
- **Markdown**: react-markdown + remark-gfm
- **Styling**: Tailwind CSS v4 + custom CSS variables
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode)

## Development Commands

```bash
# Install dependencies (if needed)
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

### Page Structure

**首页** (`app/page.tsx`)
- Server Component with static site navigation cards
- Contains three entry cards: Blog, Workspace, Build Notes
- Recent updates timeline at bottom
- Uses metadata for SEO

**Blog** (`app/blog/page.tsx`)
- Server Component with static article list
- Currently displays article cards with: slug, title, excerpt, date, tag, reading time
- Articles are defined in `BLOG_POSTS` constant (hardcoded, not from database)
- Note: Article detail pages are not yet implemented

**Workspace** (`app/workspace/page.tsx`)
- Client Component with complex state management (see details below)
- Three-panel responsive layout with auto-save functionality

### Data Layer (`lib/db.ts`)

Single-table SQLite schema stored in `data/markdown.db`:
- Database is cached in `globalThis` to avoid re-initialization in development
- WAL mode enabled for performance
- CRUD functions: `listDocs()`, `getDocById()`, `createDoc()`, `updateDoc()`
- `ensureSeedDoc()` creates a welcome document if database is empty
- Column naming: `snake_case` in DB, `camelCase` in TypeScript

```sql
CREATE TABLE docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### API Routes

**`GET/POST /api/docs`** (`app/api/docs/route.ts`)
- GET: returns `{ data: Doc[] }` - all docs sorted by `updated_at DESC`, calls `ensureSeedDoc()`
- POST: creates new doc from optional `title`/`content`, returns `{ data: Doc }` with status 201
- Invalid JSON body is handled gracefully (returns empty object)

**`GET/PATCH /api/docs/[id]`** (`app/api/docs/[id]/route.ts`)
- GET: returns single doc or 404
- PATCH: updates title/content, validates at least one field provided, returns updated doc
- Invalid JSON body is handled gracefully

Both routes set `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.

### Workspace Frontend (`app/workspace/page.tsx`)

Client-side component with sophisticated state management:

**State Pattern**:
- `docs`: array of all documents
- `activeDocId`: currently selected document
- `saveState`: "idle" | "saving" | "saved" | "error"
- `syncedSignaturesRef`: Map of `docId -> signatureOf(doc)` to track unsaved changes
- `mobilePane`: "editor" | "preview" for mobile view toggle
- `isLoading` / `isCreating`: loading states
- `loadError`: error message string or null

**Auto-save Mechanism**:
- Changes trigger 800ms debounce timer (useEffect with dependency on `activeDoc`)
- Uses `signatureOf(doc)` function to detect actual changes (title + content combined with `\u001f` separator)
- Documents are re-sorted by `updated_at` after save
- Manual save button cancels debounce and saves immediately
- Switching documents auto-saves current document before switching

**Type Guards**:
- `isDoc()` and `isDocArray()` validate API responses
- Always validate unknown data before using

**Mobile Support**:
- `mobilePane` state toggles between "editor" and "preview" views
- Responsive CSS handles visibility with `.is-visible` class
- Desktop: three-panel layout (sidebar | editor | preview)
- Mobile: single visible pane at a time with toggle buttons

### Theme System (`app/theme-sync.tsx`)

Custom theme sync for Next.js dev tools:
- Detects theme from `<nextjs-portal>` element classList (`dark` or `light`)
- Falls back to `prefers-color-scheme` media query
- Sets `data-theme` attribute on `<html>` for CSS selectors
- Uses MutationObserver to watch for devTools portal changes

### Styling System (`app/globals.css`)

**CSS Variable Architecture**:
- Light theme defined in `:root`
- Dark theme defined in `html[data-theme="dark"]`
- All colors use semantic naming: `--bg-a`, `--panel`, `--text-main`, `--accent`, etc.
- Consistent spacing with `--radius-*` tokens (xl, lg, md, sm, pill)
- Content width constrained by `--content-max` with responsive padding

**Font Variables**:
- `--font-body`: IBM Plex Sans (main text)
- `--font-mono`: IBM Plex Mono (code)
- `--font-display`: Playfair Display (headings)

**Component Classes**:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`: unified button styles
- `.card`: unified card style with hover effects
- `.tag`: unified tag/pill style
- `.input`, `.textarea`: unified form field styles

**Page-specific Styles**:
- `.site-*`: Homepage styles (hero, sections, grid, cards)
- `.blog-*`: Blog page styles (hero, grid, cards)
- `.workspace-*`: Workspace styles (grid, sidebar, editor, preview, mobile switch)

**Responsive Breakpoints**:
- Desktop: full multi-panel layouts
- 1180px and below: adjust grid columns
- 920px and below: single column, mobile toggle for editor/preview
- 560px and below: smaller padding, stacked elements

### Root Layout (`app/layout.tsx`)

- Imports and configures Google Fonts (IBM Plex Sans, IBM Plex Mono, Playfair Display)
- Sets CSS variables for fonts via `variable` prop
- Includes `ThemeSync` component for theme management
- Applies `app-body` class for global styling

## Key Conventions

- **Path alias**: `@/*` maps to project root (configured in tsconfig.json)
- **TypeScript strict mode** is enabled
- All API responses use `{ data: T }` wrapper format
- Error responses use `{ error: string }` format
- Date/time stored as ISO 8601 strings in SQLite
- Default new doc: title="Untitled note", content="# New note..."
- CSS uses semantic variable naming, not direct color values
- All animations use `@keyframes` defined in globals.css
- `.gitignore` excludes `/data/*.db` and related WAL files
