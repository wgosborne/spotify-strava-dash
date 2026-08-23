"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PaceOverTimeChartProps {
  data: Array<{
    date: Date;
    pace: string;
    paceSeconds: number;
  }>;
  dateRange: string;
}

function formatPaceLabel(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
}

export function PaceOverTimeChart({ data, dateRange }: PaceOverTimeChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    dateStr: item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const minPace = Math.min(...chartData.map((d) => d.paceSeconds));
  const maxPace = Math.max(...chartData.map((d) => d.paceSeconds));
  const paceRange = maxPace - minPace;

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 60, bottom: 30 }}
        >
          <XAxis
            dataKey="dateStr"
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fontSize: 11, fill: "#d1d5db" }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[minPace - paceRange * 0.05, maxPace + paceRange * 0.05]}
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fontSize: 11, fill: "#d1d5db" }}
            tickFormatter={formatPaceLabel}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value: any) => typeof value === "number" ? formatPaceLabel(value) : value}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
            cursor={{ stroke: "rgba(255, 255, 255, 0.1)" }}
          />
          <Line
            dataKey="paceSeconds"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
