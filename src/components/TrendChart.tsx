"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { paceHistory } from "@/lib/stats";
import { seriesColorVar } from "@/lib/palette";
import { formatDate, formatSecondsToTime, paceMinPer100 } from "@/lib/time";
import type { Distance, SwimmerWithEntries } from "@/lib/types";

type Props = {
  swimmers: SwimmerWithEntries[];
  distance: Distance;
};

type Row = { date: string } & Record<string, number | string>;

export default function TrendChart({ swimmers, distance }: Props) {
  const withHistory = swimmers.filter((s) => paceHistory(s, distance).length >= 1);

  if (!withHistory.length) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)]">
        No dated {distance}m swims logged yet.
      </div>
    );
  }

  const dateSet = new Set<string>();
  withHistory.forEach((s) => paceHistory(s, distance).forEach((e) => dateSet.add(e.date!)));
  const dates = Array.from(dateSet).sort();

  const rows: Row[] = dates.map((date) => {
    const row: Row = { date };
    withHistory.forEach((s) => {
      const entry = paceHistory(s, distance).find((e) => e.date === date);
      if (entry) row[s.name] = Number(paceMinPer100(entry.timeSeconds, distance).toFixed(2));
    });
    return row;
  });

  // Zoom the axis to the actual spread of the data (padded) rather than
  // starting at 0 — otherwise small, meaningful differences between
  // swimmers get compressed into a sliver at the top of the chart.
  const allValues = rows.flatMap((r) =>
    withHistory.map((s) => r[s.name]).filter((v): v is number => typeof v === "number")
  );
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const padding = Math.max((dataMax - dataMin) * 0.15, 2);
  const domain: [number, number] = [Math.max(0, dataMin - padding), dataMax + padding];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDate(d)}
            stroke="var(--baseline)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            // Reversed so faster times (lower seconds) sit higher on the
            // chart — "up" reads as "faster / improving", matching how
            // everything else on the page (and the eye) expects progress
            // charts to behave.
            reversed
            domain={domain}
            tickFormatter={(v: number) => formatSecondsToTime(v)}
            stroke="var(--baseline)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickLine={false}
            width={52}
            label={{
              value: "faster ↑",
              angle: -90,
              position: "insideLeft",
              fill: "var(--text-muted)",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
            }}
            labelFormatter={(d) => formatDate(String(d))}
            formatter={(value) => [`${formatSecondsToTime(Number(value))} /100`]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
          {withHistory.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.name}
              stroke={seriesColorVar(s.colorIndex)}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
