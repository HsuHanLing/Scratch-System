"use client";

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PROBABILITY_MODEL, modelToJsonString } from "@/lib/defaultModel";
import { runSimulationBatched } from "@/lib/simulation";
import type { ProbabilityModel, SimConfig, SimulationResult } from "@/lib/types";
import { parseProbabilityModelJson } from "@/lib/validate";
import { ConfigPanel, type SimFormFields } from "./ConfigPanel";
import { ProbabilityInput } from "./ProbabilityInput";
import { VisualModelEditor } from "./VisualModelEditor";
import { ResultsPanel } from "./ResultsPanel";

const defaultForm: SimFormFields = {
  initialDiamonds: 2000,
  diamondsPerScratch: 1500,
  adoptionLimit: 10,
  nUsers: 25_000,
  diamondsMultiplier: 1000,
  maxScratchCap: 10_000,
  seed: 42,
  targetLow: 8,
  targetHigh: 12,
};

export function ScratchSimulator() {
  const [form, setForm] = useState<SimFormFields>(defaultForm);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVisual, setShowVisual] = useState(true);
  const [modelText, setModelText] = useState(() => modelToJsonString(DEFAULT_PROBABILITY_MODEL));
  const [model, setModel] = useState<ProbabilityModel>(() => structuredClone(DEFAULT_PROBABILITY_MODEL));
  const [parseErrors, setParseErrors] = useState<string[] | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const onModelTextChange = useCallback((text: string) => {
    setModelText(text);
    const v = parseProbabilityModelJson(text);
    if (v.ok) {
      setParseErrors(null);
      setModel(structuredClone(v.model));
    } else {
      setParseErrors(v.errors);
    }
  }, []);

  const onVisualModelChange = useCallback((next: ProbabilityModel) => {
    setModel(next);
    setModelText(modelToJsonString(next));
    setParseErrors(null);
  }, []);

  const simConfig: SimConfig = useMemo(
    () => ({
      nUsers: Math.max(1, Math.floor(form.nUsers)),
      initialDiamonds: Math.max(0, Math.floor(form.initialDiamonds)),
      diamondsPerScratch: Math.max(1, Math.floor(form.diamondsPerScratch)),
      diamondsMultiplier: Math.max(1, Math.floor(form.diamondsMultiplier)),
      adoptionLimit: Math.max(0, Math.floor(form.adoptionLimit)),
      maxScratchCap: Math.max(1, Math.floor(form.maxScratchCap)),
      seed: form.seed >>> 0,
    }),
    [form]
  );

  const run = useCallback(async () => {
    const v = parseProbabilityModelJson(modelText);
    if (!v.ok) {
      setParseErrors(v.errors);
      return;
    }
    setParseErrors(null);
    setRunning(true);
    setProgress(0);
    setResult(null);
    try {
      const res = await runSimulationBatched(
        { ...simConfig, nUsers: simConfig.nUsers },
        v.model,
        Math.max(0, Math.floor(form.targetLow)),
        Math.max(0, Math.floor(form.targetHigh)),
        setProgress
      );
      setResult(res);
    } finally {
      setRunning(false);
      setProgress(0);
    }
  }, [modelText, simConfig, form.targetLow, form.targetHigh]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Scratch reward simulator
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Design and stress-test a scratch economy: edit parameters and probabilities, validate distributions, then
          run a Monte Carlo simulation in the browser. Deploy this app on Vercel as a static Next.js site.
        </p>
      </header>

      <ConfigPanel
        {...form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((s) => !s)}
      />

      <ProbabilityInput modelText={modelText} onModelTextChange={onModelTextChange} errors={parseErrors} />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running…" : "Run simulation"}
        </button>
        {running && (
          <div className="flex min-w-[200px] flex-1 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-zinc-500">{Math.round(progress * 100)}%</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowVisual((v) => !v)}
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          {showVisual ? "Hide visual editor" : "Show visual editor"}
        </button>
        <button
          type="button"
          onClick={() => {
            const t = modelToJsonString(DEFAULT_PROBABILITY_MODEL);
            onModelTextChange(t);
          }}
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Reset model to default
        </button>
      </div>

      {showVisual && parseErrors === null && <VisualModelEditor model={model} onChange={onVisualModelChange} />}

      {showVisual && parseErrors !== null && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Fix JSON validation errors above to enable the visual editor.
        </p>
      )}

      {result && <ResultsPanel result={result} />}
    </div>
  );
}
