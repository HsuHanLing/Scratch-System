"use client";

type Props = {
  modelText: string;
  onModelTextChange: (text: string) => void;
  errors: string[] | null;
};

export function ProbabilityInput({ modelText, onModelTextChange, errors }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Probability model (JSON)</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Paste a <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">PROBABILITY_MODEL</code>-shaped JSON
        object. Each <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">stage_card_drop_rate</code> and
        each card&apos;s <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">reward_distribution</code>{" "}
        must sum to <strong>1</strong> (within tolerance).
      </p>
      <textarea
        value={modelText}
        onChange={(e) => onModelTextChange(e.target.value)}
        spellCheck={false}
        className="mt-3 h-64 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800 outline-none ring-indigo-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        placeholder='{ "adoption": { ... }, "mature": { ... } }'
      />
      {errors && errors.length > 0 && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-medium">Validation failed</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
