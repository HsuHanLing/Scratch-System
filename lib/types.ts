export type RewardDistribution = Record<string, number>;

export type StageModel = {
  stage_card_drop_rate: Record<string, number>;
  reward_distribution: Record<string, RewardDistribution>;
};

export type ProbabilityModel = {
  adoption: StageModel;
  mature: StageModel;
};

export type SimConfig = {
  nUsers: number;
  initialDiamonds: number;
  diamondsPerScratch: number;
  diamondsMultiplier: number;
  adoptionLimit: number;
  maxScratchCap: number;
  seed: number;
};

export type SimulationSummary = {
  nUsers: number;
  avgMaxScratches: number;
  medianMaxScratches: number;
  p75MaxScratches: number;
  p90MaxScratches: number;
  p95MaxScratches: number;
  p99MaxScratches: number;
  minMaxScratches: number;
  maxMaxScratches: number;
  avgEndingDiamonds: number;
  pctInTargetBand: number;
  targetBandLow: number;
  targetBandHigh: number;
  endedByCapCount: number;
  adoptionOnlyCount: number;
  reachedMatureCount: number;
};

export type DistributionRow = {
  bucket: string;
  userCount: number;
  userRatio: number;
};

export type SimulationResult = {
  summary: SimulationSummary;
  distributionTable: DistributionRow[];
  histogram: { binLabel: string; binMid: number; count: number }[];
  cdf: { scratchCount: number; proportion: number }[];
};
