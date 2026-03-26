import type { ProbabilityModel } from "./types";

const TOLERANCE = 1e-5;

function sumValues(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

export function validateProbabilityDict(
  probDict: Record<string, number>,
  name: string
): string | null {
  const total = sumValues(probDict);
  if (Math.abs(total - 1) > TOLERANCE) {
    return `${name} must sum to 1.0 (within ${TOLERANCE}). Current total = ${total.toFixed(10)}`;
  }
  for (const [k, v] of Object.entries(probDict)) {
    if (typeof v !== "number" || Number.isNaN(v) || v < 0) {
      return `${name}[${k}] must be a non-negative number`;
    }
  }
  return null;
}

export function validateModel(model: unknown): { ok: true; model: ProbabilityModel } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (model === null || typeof model !== "object") {
    return { ok: false, errors: ["Model must be a JSON object"] };
  }
  const m = model as Record<string, unknown>;
  for (const stage of ["adoption", "mature"] as const) {
    if (!m[stage] || typeof m[stage] !== "object") {
      errors.push(`Missing or invalid stage "${stage}"`);
      continue;
    }
    const stageInfo = m[stage] as Record<string, unknown>;
    const rates = stageInfo.stage_card_drop_rate;
    if (!rates || typeof rates !== "object") {
      errors.push(`${stage}.stage_card_drop_rate must be an object`);
    } else {
      const err = validateProbabilityDict(rates as Record<string, number>, `${stage}.stage_card_drop_rate`);
      if (err) errors.push(err);
    }
    const rewards = stageInfo.reward_distribution;
    if (!rewards || typeof rewards !== "object") {
      errors.push(`${stage}.reward_distribution must be an object`);
    } else {
      for (const [cardName, dist] of Object.entries(rewards)) {
        if (!dist || typeof dist !== "object") {
          errors.push(`${stage}.reward_distribution.${cardName} must be an object`);
          continue;
        }
        const e = validateProbabilityDict(dist as Record<string, number>, `${stage}.${cardName}.reward_distribution`);
        if (e) errors.push(e);
      }
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, model: model as ProbabilityModel };
}

export function parseProbabilityModelJson(text: string): { ok: true; model: ProbabilityModel } | { ok: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
  return validateModel(parsed);
}
