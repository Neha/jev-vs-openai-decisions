import { isImageDataUrl } from "@/lib/image";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import { keysFromRequest } from "@/lib/keys";
import { runProviders } from "@/lib/run";
import type { CanonicalQuestion } from "@/lib/types";

export const maxDuration = 60;

function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in TEMPLATES;
}

function isQuestion(value: unknown): value is CanonicalQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.type === "boolean" || record.type === "choice" || record.type === "score") &&
    typeof record.instructions === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const input = typeof record.input === "string" ? record.input.trim() : "";
  const image = typeof record.image === "string" ? record.image.trim() : "";
  if (image && !isImageDataUrl(image)) {
    return Response.json(
      { error: "image must be a PNG, JPEG, or WebP data URL under ~1MB" },
      { status: 400 },
    );
  }
  if (!input && !image) {
    return Response.json({ error: "input or image is required" }, { status: 400 });
  }

  let questions: CanonicalQuestion[] | undefined;
  if (isTemplateId(record.template)) {
    questions = [...TEMPLATES[record.template].questions];
  } else if (Array.isArray(record.questions) && record.questions.every(isQuestion)) {
    questions = record.questions;
  }

  if (!questions || questions.length === 0) {
    return Response.json(
      { error: "Provide a template or a non-empty questions array" },
      { status: 400 },
    );
  }

  const result = await runProviders(
    input,
    questions,
    keysFromRequest(request),
    image || undefined,
  );
  return Response.json({ input, questions, image: Boolean(image), ...result });
}
