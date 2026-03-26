import { createMulberry32 } from "./rng";
import type { ProbabilityModel, SimConfig, SimulationResult, SimulationSummary, DistributionRow } from "./types";

function weightedRandomChoice(probDict: Record<string, number>, rng: () => number): string {
  const r = rng();
  let cum = 0;
  const entries = Object.entries(probDict);
  for (const [k, p] of entries) {
    cum += p;
    if (r < cum) return k;
  }
  return entries[entries.length - 1]?.[0] ?? "0";
}

function rewardKeyToUnit(key: string): number {
  const n = Number(key);
  return Number.isFinite(n) ? n : 0;
}

function getStageByScratchNumber(scratchNumber: number, adoptionLimit: number): "adoption" | "mature" {
  return scratchNumber <= adoptionLimit ? "adoption" : "mature";
}

function simulateOneScratch(
  scratchNumber: number,
  model: ProbabilityModel,
  rng: () => number,
  adoptionLimit: number
): { rewardUnit: number; rewardDiamonds: number } {
  const stage = getStageByScratchNumber(scratchNumber, adoptionLimit);
  const stageInfo = model[stage];
  const cardType = weightedRandomChoice(stageInfo.stage_card_drop_rate, rng);
  const rewardDist = stageInfo.reward_distribution[cardType];
  const unitKey = weightedRandomChoice(rewardDist, rng);
  const rewardUnit = rewardKeyToUnit(unitKey);
  return { rewardUnit, rewardDiamonds: rewardUnit }; // multiplier applied in caller
}

export function simulateOneUser(
  userId: number,
  model: ProbabilityModel,
  rng: () => number,
  config: SimConfig
): {
  maxScratchCount: number;
  endingDiamonds: number;
  endedByCap: boolean;
} {
  let currentDiamonds = config.initialDiamonds;
  let scratchCount = 0;

  while (currentDiamonds >= config.diamondsPerScratch && scratchCount < config.maxScratchCap) {
    currentDiamonds -= config.diamondsPerScratch;
    scratchCount += 1;
    const { rewardDiamonds } = simulateOneScratch(scratchCount, model, rng, config.adoptionLimit);
    currentDiamonds += rewardDiamonds * config.diamondsMultiplier;
  }
  return {
    maxScratchCount: scratchCount,
    endingDiamonds: currentDiamonds,
    endedByCap: scratchCount >= config.maxScratchCap,
  };
}

function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) return sorted[base];
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const DIST_BINS = [-1, 0, 1, 2, 3, 5, 10, 24, 50, 100, Infinity] as const;
const DIST_LABELS = ["0", "1", "2", "3", "4-5", "6-10", "11-24", "25-50", "51-100", "100+"] as const;

function bucketIndex(value: number): number {
  for (let i = 0; i < DIST_BINS.length - 1; i++) {
    if (value > DIST_BINS[i] && value <= DIST_BINS[i + 1]) return i;
  }
  return DIST_LABELS.length - 1;
}

export function buildDistributionTable(scratchCounts: number[]): DistributionRow[] {
  const counts = new Array(DIST_LABELS.length).fill(0);
  for (const v of scratchCounts) {
    counts[bucketIndex(v)] += 1;
  }
  const total = scratchCounts.length || 1;
  return DIST_LABELS.map((bucket, i) => ({
    bucket,
    userCount: counts[i],
    userRatio: counts[i] / total,
  }));
}

function buildHistogram(scratchCounts: number[], binCount = 40) {
  if (scratchCounts.length === 0) {
    return [{ binLabel: "0", binMid: 0, count: 0 }];
  }
  let min = Infinity;
  let max = -Infinity;
  for (const v of scratchCounts) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return [{ binLabel: String(min), binMid: min, count: scratchCounts.length }];
  }
  const range = max - min;
  const binWidth = range / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const lo = min + i * binWidth;
    const hi = min + (i + 1) * binWidth;
    const mid = (lo + hi) / 2;
    return {
      binLabel: `${Math.round(lo)}–${Math.round(hi)}`,
      binMid: mid,
      count: 0,
    };
  });
  for (const v of scratchCounts) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  }
  return bins;
}

function buildCdf(scratchCounts: number[]): { scratchCount: number; proportion: number }[] {
  if (scratchCounts.length === 0) return [];
  const sorted = [...scratchCounts].sort((a, b) => a - b);
  const n = sorted.length;
  const maxPoints = 800;
  if (n <= maxPoints) {
    return sorted.map((scratchCount, i) => ({
      scratchCount,
      proportion: (i + 1) / n,
    }));
  }
  const step = n / maxPoints;
  const out: { scratchCount: number; proportion: number }[] = [];
  for (let j = 0; j < maxPoints; j++) {
    const idx = Math.min(n - 1, Math.floor((j + 1) * step) - 1);
    const i = Math.max(0, idx);
    out.push({ scratchCount: sorted[i], proportion: (i + 1) / n });
  }
  return out;
}

const DEFAULT_TARGET_LOW = 8;
const DEFAULT_TARGET_HIGH = 12;

export function runSimulationSync(
  config: SimConfig,
  model: ProbabilityModel,
  targetLow = DEFAULT_TARGET_LOW,
  targetHigh = DEFAULT_TARGET_HIGH
): SimulationResult {
  const rng = createMulberry32(config.seed);
  const scratchCounts: number[] = new Array(config.nUsers);
  let endedByCapCount = 0;
  let adoptionOnlyCount = 0;
  let reachedMatureCount = 0;
  let sumEnding = 0;

  for (let i = 0; i < config.nUsers; i++) {
    const r = simulateOneUser(i + 1, model, rng, config);
    scratchCounts[i] = r.maxScratchCount;
    sumEnding += r.endingDiamonds;
    if (r.endedByCap) endedByCapCount += 1;
    if (r.maxScratchCount <= config.adoptionLimit) adoptionOnlyCount += 1;
    if (r.maxScratchCount >= config.adoptionLimit + 1) reachedMatureCount += 1;
  }

  const sorted = [...scratchCounts].sort((a, b) => a - b);
  const inBand = scratchCounts.filter((c) => c >= targetLow && c <= targetHigh).length;

  const summary: SimulationSummary = {
    nUsers: config.nUsers,
    avgMaxScratches: mean(scratchCounts),
    medianMaxScratches: quantileSorted(sorted, 0.5),
    p75MaxScratches: quantileSorted(sorted, 0.75),
    p90MaxScratches: quantileSorted(sorted, 0.9),
    p95MaxScratches: quantileSorted(sorted, 0.95),
    p99MaxScratches: quantileSorted(sorted, 0.99),
    minMaxScratches: sorted[0] ?? 0,
    maxMaxScratches: sorted[sorted.length - 1] ?? 0,
    avgEndingDiamonds: sumEnding / (config.nUsers || 1),
    pctInTargetBand: (inBand / (config.nUsers || 1)) * 100,
    targetBandLow: targetLow,
    targetBandHigh: targetHigh,
    endedByCapCount,
    adoptionOnlyCount,
    reachedMatureCount,
  };

  return {
    summary,
    distributionTable: buildDistributionTable(scratchCounts),
    histogram: buildHistogram(scratchCounts),
    cdf: buildCdf(scratchCounts),
  };
}

export function runSimulationBatched(
  config: SimConfig,
  model: ProbabilityModel,
  targetLow: number,
  targetHigh: number,
  onProgress: (fraction: number) => void
): Promise<SimulationResult> {
  return new Promise((resolve) => {
    const rng = createMulberry32(config.seed);
    const scratchCounts: number[] = new Array(config.nUsers);
    let endedByCapCount = 0;
    let adoptionOnlyCount = 0;
    let reachedMatureCount = 0;
    let sumEnding = 0;
    let i = 0;
    const batch = Math.max(500, Math.floor(config.nUsers / 200));

    function tick() {
      const end = Math.min(i + batch, config.nUsers);
      for (; i < end; i++) {
        const r = simulateOneUser(i + 1, model, rng, config);
        scratchCounts[i] = r.maxScratchCount;
        sumEnding += r.endingDiamonds;
        if (r.endedByCap) endedByCapCount += 1;
        if (r.maxScratchCount <= config.adoptionLimit) adoptionOnlyCount += 1;
        if (r.maxScratchCount >= config.adoptionLimit + 1) reachedMatureCount += 1;
      }
      onProgress(i / config.nUsers);
      if (i < config.nUsers) {
        requestAnimationFrame(tick);
      } else {
        const sorted = [...scratchCounts].sort((a, b) => a - b);
        const inBand = scratchCounts.filter((c) => c >= targetLow && c <= targetHigh).length;
        const summary: SimulationSummary = {
          nUsers: config.nUsers,
          avgMaxScratches: mean(scratchCounts),
          medianMaxScratches: quantileSorted(sorted, 0.5),
          p75MaxScratches: quantileSorted(sorted, 0.75),
          p90MaxScratches: quantileSorted(sorted, 0.9),
          p95MaxScratches: quantileSorted(sorted, 0.95),
          p99MaxScratches: quantileSorted(sorted, 0.99),
          minMaxScratches: sorted[0] ?? 0,
          maxMaxScratches: sorted[sorted.length - 1] ?? 0,
          avgEndingDiamonds: sumEnding / (config.nUsers || 1),
          pctInTargetBand: (inBand / (config.nUsers || 1)) * 100,
          targetBandLow: targetLow,
          targetBandHigh: targetHigh,
          endedByCapCount,
          adoptionOnlyCount,
          reachedMatureCount,
        };
        resolve({
          summary,
          distributionTable: buildDistributionTable(scratchCounts),
          histogram: buildHistogram(scratchCounts),
          cdf: buildCdf(scratchCounts),
        });
      }
    }
    tick();
  });
}
