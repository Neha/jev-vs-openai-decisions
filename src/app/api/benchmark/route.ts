import { connection } from "next/server";
import { BENCHMARK_CASES } from "@/data/benchmark";
import { configuredFromKeys, envConfigured, keysFromRequest } from "@/lib/keys";
import { summarize } from "@/lib/metrics";
import { runCase } from "@/lib/run";
import type { ScoredProviderResult } from "@/lib/types";

export const maxDuration = 300;

export async function GET() {
  await connection();
  return Response.json({
    env: envConfigured(),
    cases: BENCHMARK_CASES,
    total: BENCHMARK_CASES.length,
  });
}

export async function POST(request: Request) {
  const keys = keysFromRequest(request);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({
        type: "status",
        configured: configuredFromKeys(keys),
        total: BENCHMARK_CASES.length,
      });

      const jevResults: ScoredProviderResult[] = [];
      const layaResults: ScoredProviderResult[] = [];
      const openaiResults: ScoredProviderResult[] = [];

      for (const [index, testCase] of BENCHMARK_CASES.entries()) {
        try {
          const result = await runCase(testCase, keys);
          jevResults.push(result.jev);
          layaResults.push(result.laya);
          openaiResults.push(result.openai);
          send({
            type: "case",
            index,
            caseId: testCase.id,
            title: testCase.title,
            input: testCase.input,
            questions: testCase.questions,
            gold: testCase.gold,
            jev: result.jev,
            laya: result.laya,
            openai: result.openai,
            summaries: {
              jev: summarize(jevResults, "jev"),
              laya: summarize(layaResults, "laya"),
              openai: summarize(openaiResults, "openai"),
            },
          });
        } catch (error) {
          send({
            type: "case-error",
            index,
            caseId: testCase.id,
            error: error instanceof Error ? error.message : "Case failed",
          });
        }
      }

      send({
        type: "done",
        summaries: {
          jev: summarize(jevResults, "jev"),
          laya: summarize(layaResults, "laya"),
          openai: summarize(openaiResults, "openai"),
        },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
