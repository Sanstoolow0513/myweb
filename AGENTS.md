# AGENTS.md

## Purpose
- Guidance for agentic coding assistants operating in this repository.
- Captures current build/lint/test commands and core coding conventions.
- Applies to all files unless a future rule file overrides it.

## Rule Sources Checked
- `CLAUDE.md`: present and incorporated below.
- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If Cursor/Copilot rule files are added later, merge them into this file.

## Project Snapshot
- Next.js 16 App Router + React 19.
- TypeScript with `strict: true`.
- Tailwind CSS v4 + custom CSS in `app/globals.css`.
- Markdown rendering via `react-markdown` + `remark-gfm`.
- Local SQLite with `better-sqlite3`.
- Package manager: `pnpm`.
- Alias: `@/*` points to repository root.

## Setup And Commands
### Install
```bash
pnpm install
```

### Development
```bash
pnpm dev
```
- Default URL: `http://localhost:3000`.

### Production build
```bash
pnpm build
```

### Start production server
```bash
pnpm start
```

### Lint all files
```bash
pnpm lint
```

### Lint one file
```bash
pnpm exec eslint app/page.tsx
```

### Type check
```bash
pnpm exec tsc --noEmit
```

## Test Commands
### Current state
- No `test` script in `package.json`.
- No test framework config files are present.
- There is currently no project-native full-test command.
- There is currently no project-native single-test command.

### Single-test commands (after a runner is added)
- Vitest file:
```bash
pnpm exec vitest run path/to/file.test.ts
```
- Vitest test name:
```bash
pnpm exec vitest run path/to/file.test.ts -t "test name"
```
- Jest file:
```bash
pnpm exec jest path/to/file.test.ts
```
- Playwright spec:
```bash
pnpm exec playwright test tests/example.spec.ts
```

## Code Style Guidelines
### Imports
- Use ESM import/export syntax only.
- Prefer `import type` for type-only imports.
- Import order: external packages, alias imports (`@/...`), then relative imports.
- Prefer alias imports over deep relative traversals.
- Use Node built-ins with `node:` prefix.

### Formatting
- Use double quotes and semicolons.
- Keep trailing commas where lint/formatter expects them.
- Prefer early returns to reduce nested logic.
- Keep helper functions small and focused.
- Add comments only for non-obvious intent.

### Types
- Prefer `type` aliases to match existing code.
- Keep code strict-safe; avoid `any`.
- Use `unknown` for external data and narrow with type guards.
- Use focused guards like `isDoc` and `isDocArray`.
- Model finite states with union types.
- Keep nullable states explicit (`string | null`, `Doc | null`).

### Naming
- Types/components: `PascalCase`.
- Variables/functions/hooks: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Database columns: `snake_case`.
- CSS classes: kebab-case, with `is-*` state modifiers where helpful.

### Error handling
- API write/update handlers should use `try/catch`.
- Return meaningful statuses (`400`, `404`, `500`) on known failures.
- Do not leak internal stack traces in API responses.
- In client code, check `response.ok` before parsing payloads.
- Fail safely when payload validation fails.

### React and state
- Use function components with hooks.
- Use `useMemo` for derived values.
- Use `useCallback` for handlers reused in effects/renders.
- Use refs for mutable non-render state (timers, cached signatures).
- Debounced autosave must clear timers on cleanup.
- Prefer immutable updates (`map`, spread).

### API conventions
- Success payload shape: `{ data: T }`.
- Error payload shape: `{ error: string }`.
- Route files use `runtime = "nodejs"` and `dynamic = "force-dynamic"`.
- Validate request JSON from `unknown` before reading fields.
- Validate API response payloads in the client.

### Database conventions
- Keep explicit row-to-domain mapping (`snake_case` -> `camelCase`).
- Timestamps should be ISO strings from `new Date().toISOString()`.
- Keep document lists sorted by latest `updated_at`.
- Keep `data/*.db`, `*.db-shm`, and `*.db-wal` untracked.

### CSS and UI
- Preserve existing visual language and theme-token approach.
- Reuse CSS custom properties before adding new ones.
- Respect current breakpoints (`1180`, `920`, `560`).
- Keep typography tied to font variables from `app/layout.tsx`.
- Keep animations intentional and subtle.

## Agent Workflow Checklist
- Read related files before editing.
- Keep edits scoped; avoid unrelated refactors.
- After edits, run `pnpm lint`.
- For TS-heavy changes, run `pnpm exec tsc --noEmit`.
- For larger changes, run `pnpm build`.
- Never commit local DB files or secrets.
