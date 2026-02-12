import { NextResponse } from "next/server";
import { getDocById, updateDoc } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const doc = getDocById(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ data: doc });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const input = parseDocInput(body);

    if (input.title === undefined && input.content === undefined) {
      return NextResponse.json(
        { error: "No fields were provided for update." },
        { status: 400 },
      );
    }

    const doc = updateDoc(id, input);
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ data: doc });
  } catch {
    return NextResponse.json(
      { error: "Unable to update document." },
      { status: 500 },
    );
  }
}
