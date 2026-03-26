import { NextResponse } from "next/server";
import { DEFAULT_PROBABILITY_MODEL } from "@/lib/defaultModel";
import { parseProbabilityModelJson, validateModel } from "@/lib/validate";
import { runSimulationSync } from "@/lib/simulation";
import type { ProbabilityModel, SimConfig } from "@/lib/types";

const MAX_USERS_API = 250_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      model: modelRaw,
      modelJson,
      config: configRaw,
      targetLow = 8,
      targetHigh = 12,
    } = body as {
      model?: ProbabilityModel;
      modelJson?: string;
      config?: Partial<SimConfig>;
      targetLow?: number;
      targetHigh?: number;
    };

    let model: ProbabilityModel = DEFAULT_PROBABILITY_MODEL;
    if (typeof modelJson === "string") {
      const parsed = parseProbabilityModelJson(modelJson);
      if (!parsed.ok) {
        return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 400 });
      }
      model = parsed.model;
    } else if (modelRaw && typeof modelRaw === "object") {
      const v = validateModel(modelRaw);
      if (!v.ok) {
        return NextResponse.json({ ok: false, errors: v.errors }, { status: 400 });
      }
      model = v.model;
    }

    const config: SimConfig = {
      nUsers: Math.min(MAX_USERS_API, Math.max(1, Number(configRaw?.nUsers) || 10_000)),
      initialDiamonds: Math.max(0, Number(configRaw?.initialDiamonds) ?? 2000),
      diamondsPerScratch: Math.max(1, Number(configRaw?.diamondsPerScratch) ?? 1500),
      diamondsMultiplier: Math.max(1, Number(configRaw?.diamondsMultiplier) ?? 1000),
      adoptionLimit: Math.max(0, Number(configRaw?.adoptionLimit) ?? 10),
      maxScratchCap: Math.max(1, Number(configRaw?.maxScratchCap) ?? 10_000),
      seed: Number(configRaw?.seed) >>> 0 || 42,
    };

    const result = runSimulationSync(config, model, targetLow, targetHigh);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, errors: [e instanceof Error ? e.message : "Request failed"] },
      { status: 500 }
    );
  }
}
