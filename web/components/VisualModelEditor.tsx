"use client";

import type { ProbabilityModel, StageModel } from "@/lib/types";

const CARD_TYPES = ["common", "rare", "super_rare", "super_super_rare", "legendary"] as const;
const REWARD_KEYS = Array.from({ length: 11 }, (_, i) => String(i));
const STAGES = ["adoption", "mature"] as const;

type Props = {
  model: ProbabilityModel;
  onChange: (next: ProbabilityModel) => void;
};

export function VisualModelEditor({ model, onChange }: Props) {
  const updateStage = (stage: (typeof STAGES)[number], patch: (s: StageModel) => StageModel) => {
    const next = structuredClone(model);
    next[stage] = patch(next[stage]);
    onChange(next);
  };

  const setDropRate = (stage: (typeof STAGES)[number], card: string, value: number) => {
    updateStage(stage, (s) => ({
      ...s,
      stage_card_drop_rate: { ...s.stage_card_drop_rate, [card]: value },
    }));
  };

  const setReward = (stage: (typeof STAGES)[number], card: string, unit: string, value: number) => {
    updateStage(stage, (s) => ({
      ...s,
      reward_distribution: {
        ...s.reward_distribution,
        [card]: { ...s.reward_distribution[card], [unit]: value },
      },
    }));
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Visual editor</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Sliders and fields update the JSON model. Rebalancing is your responsibility — use Run to validate sums.
      </p>
      <div className="mt-4 space-y-8">
        {STAGES.map((stage) => (
          <div key={stage}>
            <h3 className="text-sm font-semibold capitalize text-indigo-600 dark:text-indigo-400">{stage}</h3>
            <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Stage card drop rates</p>
            <div className="mt-2 space-y-3">
              {CARD_TYPES.map((card) => {
                const p = model[stage].stage_card_drop_rate[card] ?? 0;
                return (
                  <div key={card} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="w-40 shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-300">{card}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.0001}
                      value={Math.min(1, Math.max(0, p))}
                      onChange={(e) => setDropRate(stage, card, Number(e.target.value))}
                      className="h-2 flex-1 accent-indigo-600"
                    />
                    <input
                      type="number"
                      step={0.0001}
                      min={0}
                      max={1}
                      value={p}
                      onChange={(e) => setDropRate(stage, card, Number(e.target.value))}
                      className="w-28 shrink-0 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-4">
              {CARD_TYPES.map((card) => (
                <details key={card} className="rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Rewards: {card}
                  </summary>
                  <div className="grid gap-2 border-t border-zinc-100 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800">
                    {REWARD_KEYS.map((unit) => {
                      const v = model[stage].reward_distribution[card]?.[unit] ?? 0;
                      return (
                        <label key={unit} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-zinc-500">{unit}</span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.0001}
                            value={Math.min(1, Math.max(0, v))}
                            onChange={(e) => setReward(stage, card, unit, Number(e.target.value))}
                            className="h-2 flex-1 accent-zinc-500"
                          />
                          <input
                            type="number"
                            step={0.0001}
                            min={0}
                            max={1}
                            value={v}
                            onChange={(e) => setReward(stage, card, unit, Number(e.target.value))}
                            className="w-20 rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </label>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
