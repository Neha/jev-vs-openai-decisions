"use client";

import { useId, useState } from "react";
import { VISION_SAMPLES, type VisionSample } from "@/data/vision-samples";
import { apiKeyHeaders } from "@/lib/client-keys";
import { fileToImageDataUrl, renderVisionSample } from "@/lib/client-image";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import type { ProviderResult } from "@/lib/types";
import { ProviderPanel } from "./provider-panel";

const SAMPLE =
  "I was charged twice for my order and nobody has replied for 3 days. I need this refunded before my card statement closes tomorrow.";

const skipImageReason = (name: string) =>
  `${name} reads text only. Remove the photo to run both.`;

export function Playground() {
  const fileId = useId();
  const [template, setTemplate] = useState<TemplateId>("combined");
  const [input, setInput] = useState(SAMPLE);
  const [image, setImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    jev?: ProviderResult;
    openai?: ProviderResult;
  }>({});

  const questions = TEMPLATES[template].questions;
  const canRun = Boolean(input.trim() || image);
  const runLabel = image
    ? running
      ? "Running OpenAI…"
      : "Run OpenAI"
    : running
      ? "Running…"
      : "Run both";

  async function attachFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setImageError(null);
    try {
      const dataUrl = await fileToImageDataUrl(file);
      setImage({ name: file.name, dataUrl });
      setResults({});
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : "Could not read that image.");
    }
  }

  async function loadSample(sample: VisionSample) {
    setImageError(null);
    setInput(sample.input);
    setImage({ name: `${sample.id}.jpg`, dataUrl: renderVisionSample(sample.id) });
    setResults({});
  }

  async function run() {
    if (!canRun) {
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: apiKeyHeaders(),
        body: JSON.stringify({
          input,
          template,
          image: image?.dataUrl,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        jev?: ProviderResult;
        openai?: ProviderResult;
      };
      if (!response.ok) {
        setError(data.error ?? "Run failed");
        return;
      }
      setResults({ jev: data.jev, openai: data.openai });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-[32px] bg-[var(--panel)] p-8 sm:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[15px] font-medium text-[var(--muted)]">Step 1 · not scored</p>
          <h2 className="mt-2 text-[34px] leading-none font-semibold tracking-tight">Try one ticket</h2>
          <p className="mt-3 max-w-xl text-[19px] leading-7 text-[var(--muted)]">
            Paste a message. Add a photo only if you want OpenAI to read it — Jev will sit out.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-stretch">
        <label className="flex-1">
          <span className="text-[15px] font-medium text-[var(--muted)]">Message</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
            className="mt-2 w-full rounded-[22px] border border-[var(--line)] bg-[var(--bg)] px-5 py-4 text-[19px] leading-8 outline-none focus:border-[var(--text)]/25"
          />
        </label>
        <div className="flex w-full flex-col gap-2 md:w-64 lg:w-72">
          <span className="text-[15px] font-medium text-[var(--muted)]">Photo · OpenAI only</span>
          {image ? (
            <div className="relative overflow-hidden rounded-[22px] bg-[var(--bg)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt={image.name} className="h-48 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setResults({});
                }}
                className="absolute top-3 right-3 rounded-full bg-[var(--text)] px-3 py-1.5 text-[13px] text-[var(--on-btn)]"
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor={fileId}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void attachFile(event.dataTransfer.files[0]);
              }}
              className="flex h-48 cursor-pointer items-center justify-center rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--bg)] px-5 text-center text-[17px] leading-6 text-[var(--muted)] hover:border-[var(--text)]/25"
            >
              Drop a PNG, JPEG, or WebP
            </label>
          )}
          <input
            id={fileId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void attachFile(file);
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <select
          value={template}
          onChange={(event) => setTemplate(event.target.value as TemplateId)}
          className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-5 py-3.5 text-[17px]"
        >
          {Object.values(TEMPLATES).map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || !canRun}
          className="rounded-full bg-[var(--btn)] px-8 py-3.5 text-[17px] font-semibold text-[var(--on-btn)] disabled:opacity-40"
        >
          {runLabel}
        </button>
        {image ? (
          <p className="text-[15px] text-[var(--muted)]">Photo attached · OpenAI only</p>
        ) : null}
      </div>
      {imageError ? <p className="mt-4 text-[17px] text-[var(--bad)]">{imageError}</p> : null}
      {error ? <p className="mt-4 text-[17px] text-[var(--bad)]">{error}</p> : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ProviderPanel
          accent="jev"
          model="jev-latest"
          result={results.jev}
          questions={questions}
          capability="Text only"
          skipReason={image ? skipImageReason("Jev") : undefined}
        />
        <ProviderPanel
          accent="openai"
          model="gpt-6-luna"
          result={results.openai}
          questions={questions}
          capability="Text and photos"
        />
      </div>

      <VisionLane onLoad={loadSample} />
    </section>
  );
}

function VisionLane({ onLoad }: { onLoad: (sample: VisionSample) => void }) {
  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <h3 className="text-[28px] font-semibold tracking-tight">Or start from a photo</h3>
      <p className="mt-2 max-w-xl text-[17px] leading-7 text-[var(--muted)]">
        OpenAI-only. These never feed the scoreboard.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {VISION_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onLoad(sample)}
            className="rounded-[22px] bg-[var(--bg)] p-6 text-left hover:bg-[var(--panel-2)]"
          >
            <p className="text-[22px] font-semibold tracking-tight">{sample.title}</p>
            <p className="mt-2 text-[16px] leading-6 text-[var(--muted)]">{sample.blurb}</p>
            <p className="mt-5 text-[15px] font-medium text-[var(--openai)]">Load ticket</p>
          </button>
        ))}
      </div>
    </div>
  );
}
