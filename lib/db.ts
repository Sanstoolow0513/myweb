import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

export type Doc = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type DocRow = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type SqliteDatabase = InstanceType<typeof Database>;

const DEFAULT_TITLE = "Untitled note";
const DEFAULT_DOC_CONTENT = `# Welcome

This is your Markdown workspace.

- Edit on the left
- Preview on the right
- Changes are auto-saved to SQLite
`;

const globalForDb = globalThis as typeof globalThis & {
  markdownDb?: SqliteDatabase;
};

function mapRowToDoc(row: DocRow): Doc {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getDatabasePath(): string {
  return join(process.cwd(), "data", "markdown.db");
}

function initializeDatabase(): SqliteDatabase {
  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_docs_updated_at ON docs(updated_at DESC);
  `);

  return db;
}

function getDb(): SqliteDatabase {
  if (!globalForDb.markdownDb) {
    globalForDb.markdownDb = initializeDatabase();
  }

  return globalForDb.markdownDb;
}

function normalizeTitle(title: string | undefined): string {
  const value = title?.trim();
  return value && value.length > 0 ? value : DEFAULT_TITLE;
}

export function listDocs(): Doc[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, content, created_at, updated_at FROM docs ORDER BY updated_at DESC`,
    )
    .all() as DocRow[];

  return rows.map(mapRowToDoc);
}

export function getDocById(id: string): Doc | null {
  const row = getDb()
    .prepare(`SELECT id, title, content, created_at, updated_at FROM docs WHERE id = ?`)
    .get(id) as DocRow | undefined;

  return row ? mapRowToDoc(row) : null;
}

export function createDoc(input?: { title?: string; content?: string }): Doc {
  const now = new Date().toISOString();
  const id = randomUUID();
  const title = normalizeTitle(input?.title);
  const content = input?.content ?? DEFAULT_DOC_CONTENT;

  getDb()
    .prepare(`INSERT INTO docs (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, title, content, now, now);

  const created = getDocById(id);
  if (!created) {
    throw new Error("Document creation failed.");
  }

  return created;
}

export function updateDoc(
  id: string,
  input: { title?: string; content?: string },
): Doc | null {
  const existing = getDocById(id);
  if (!existing) {
    return null;
  }

  const nextTitle = input.title === undefined ? existing.title : normalizeTitle(input.title);
  const nextContent = input.content === undefined ? existing.content : input.content;
  const now = new Date().toISOString();

  getDb()
    .prepare(`UPDATE docs SET title = ?, content = ?, updated_at = ? WHERE id = ?`)
    .run(nextTitle, nextContent, now, id);

  return getDocById(id);
}

export function ensureSeedDoc(): void {
  const result = getDb().prepare(`SELECT COUNT(1) as count FROM docs`).get() as {
    count: number;
  };

  if (result.count === 0) {
    createDoc({
      title: "Welcome",
      content: DEFAULT_DOC_CONTENT,
    });
  }
}
