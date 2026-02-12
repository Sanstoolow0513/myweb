import { NextResponse } from "next/server";
import { createDoc, ensureSeedDoc, listDocs } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocInput = {
  title?: string;
  content?: string;
};

function parseDocInput(value: unknown): DocInput {
  if (!value || typeof value !== "object") {
    return {};
  }

  const data = value as Record<string, unknown>;
  const parsed: DocInput = {};

  if (typeof data.title === "string") {
    parsed.title = data.title;
  }

  if (typeof data.content === "string") {
    parsed.content = data.content;
  }

  return parsed;
}

export async function GET() {
  ensureSeedDoc();
  return NextResponse.json({ data: listDocs() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const doc = createDoc(parseDocInput(body));
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create document." },
      { status: 500 },
    );
  }
}
