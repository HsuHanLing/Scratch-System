"use client";

export type SimFormFields = {
  initialDiamonds: number;
  diamondsPerScratch: number;
  adoptionLimit: number;
  nUsers: number;
  diamondsMultiplier: number;
  maxScratchCap: number;
  seed: number;
  targetLow: number;
  targetHigh: number;
};

type Props = SimFormFields & {
  onChange: (patch: Partial<SimFormFields>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

export function ConfigPanel({
  initialDiamonds,
  diamondsPerScratch,
  adoptionLimit,
  nUsers,
  diamondsMultiplier,
  maxScratchCap,
  seed,
  targetLow,
  targetHigh,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Configuration</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Match the Python script variables. Adjust and run the simulation without editing code.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="INITIAL_DIAMONDS"
          value={initialDiamonds}
          onChange={(v) => onChange({ initialDiamonds: v })}
          min={0}
          step={1}
        />
        <Field
          label="DIAMONDS_PER_SCRATCH"
          value={diamondsPerScratch}
          onChange={(v) => onChange({ diamondsPerScratch: v })}
          min={1}
          step={1}
        />
        <Field
          label="ADOPTION_LIMIT"
          value={adoptionLimit}
          onChange={(v) => onChange({ adoptionLimit: v })}
          min={0}
          step={1}
        />
        <Field
          label="Number of users"
          value={nUsers}
          onChange={(v) => onChange({ nUsers: v })}
          min={1}
          max={2_000_000}
          step={1}
        />
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {showAdvanced ? "Hide advanced" : "Advanced (multiplier, cap, seed, target band)"}
        </button>
        {showAdvanced && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="DIAMONDS_MULTIPLIER"
              value={diamondsMultiplier}
              onChange={(v) => onChange({ diamondsMultiplier: v })}
              min={1}
              step={1}
            />
            <Field
              label="MAX_SCRATCH_CAP"
              value={maxScratchCap}
              onChange={(v) => onChange({ maxScratchCap: v })}
              min={1}
              step={1}
            />
            <Field
              label="RANDOM_SEED"
              value={seed}
              onChange={(v) => onChange({ seed: v >>> 0 })}
              min={0}
              step={1}
            />
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <Field
                label="Target band (low)"
                value={targetLow}
                onChange={(v) => onChange({ targetLow: v })}
                min={0}
                step={1}
              />
              <Field
                label="Target band (high)"
                value={targetHigh}
                onChange={(v) => onChange({ targetHigh: v })}
                min={0}
                step={1}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </label>
  );
}
