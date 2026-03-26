"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationResult } from "@/lib/types";

type Props = {
  result: SimulationResult;
};

export function ResultsPanel({ result }: Props) {
  const { summary, distributionTable, histogram, cdf } = result;
  const centred =
    summary.pctInTargetBand >= 25
      ? "A sizeable share of users land in the target band."
      : "Mass is outside the target band — consider tuning drop rates or rewards.";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Key metrics</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Average scratches" value={summary.avgMaxScratches.toFixed(2)} />
          <Metric label="Median (P50)" value={summary.medianMaxScratches.toFixed(2)} />
          <Metric label="P75" value={summary.p75MaxScratches.toFixed(2)} />
          <Metric label="P90" value={summary.p90MaxScratches.toFixed(2)} />
          <Metric label="P95" value={summary.p95MaxScratches.toFixed(2)} />
          <Metric label="P99" value={summary.p99MaxScratches.toFixed(2)} />
          <Metric label="Min / Max" value={`${summary.minMaxScratches} / ${summary.maxMaxScratches}`} />
          <Metric label="Avg ending diamonds" value={summary.avgEndingDiamonds.toFixed(1)} />
        </div>
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            summary.pctInTargetBand >= 25
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          }`}
        >
          <p className="font-medium">
            Target band [{summary.targetBandLow}, {summary.targetBandHigh}]:{" "}
            {summary.pctInTargetBand.toFixed(2)}% of users
          </p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">{centred}</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Adoption-only (≤ limit): {summary.adoptionOnlyCount.toLocaleString()} · Reached mature:{" "}
            {summary.reachedMatureCount.toLocaleString()}
            {summary.endedByCapCount > 0 && (
              <> · Hit scratch cap: {summary.endedByCapCount.toLocaleString()}</>
            )}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distribution table</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-2 pr-4 font-medium">Max scratches (bucket)</th>
                <th className="py-2 pr-4 font-medium">Users</th>
                <th className="py-2 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {distributionTable.map((row) => (
                <tr key={row.bucket} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4">{row.bucket}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.userCount.toLocaleString()}</td>
                  <td className="py-2 tabular-nums">{(row.userRatio * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Histogram (scratch count)</h2>
        <div className="mt-4 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="binMid" tickFormatter={(v) => String(Math.round(Number(v)))} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "Users"]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as { binLabel?: string } | undefined;
                  return p?.binLabel ?? "";
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">CDF (max scratches)</h2>
        <div className="mt-4 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cdf} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="scratchCount" fontSize={11} />
              <YAxis domain={[0, 1]} tickFormatter={(t) => `${(Number(t) * 100).toFixed(0)}%`} fontSize={11} />
              <Tooltip
                formatter={(value: number) => [`${(Number(value) * 100).toFixed(2)}%`, "Cumulative"]}
                labelFormatter={(l) => `≤ ${l} scratches`}
              />
              <Line type="stepAfter" dataKey="proportion" stroke="#0ea5e9" strokeWidth={2} dot={false} name="CDF" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}
