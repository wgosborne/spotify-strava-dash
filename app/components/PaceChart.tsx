"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChartData {
  trackName: string;
  artist: string;
  pace: string;
  paceInSecondsPerMile: number;
}

interface PaceChartProps {
  data: ChartData[];
}

function formatPaceLabel(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
}

export function PaceChart({ data }: PaceChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    displayName: `${item.trackName.substring(0, 20)}...`,
    fullName: `${item.trackName} • ${item.artist}`,
  }));

  const chartHeight = Math.max(data.length * 50, 400);
  const chartWidth = Math.max(600, data.length * 20);

  return (
    <div className="w-full overflow-x-auto">
      <BarChart
        width={chartWidth}
        height={chartHeight}
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 150, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis
          type="number"
          stroke="#888888"
          tickFormatter={formatPaceLabel}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          dataKey="displayName"
          type="category"
          width={140}
          stroke="#888888"
          tick={{ fontSize: 11, fill: "#d1d5db" }}
          interval={0}
        />
        <Tooltip
          formatter={(value: number) => formatPaceLabel(value)}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.displayName === label);
            return item ? item.fullName : "";
          }}
          contentStyle={{
            backgroundColor: "#121212",
            border: "1px solid #2a2a2a",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(29, 185, 84, 0.1)" }}
        />
        <Bar
          dataKey="paceInSecondsPerMile"
          fill="#1db954"
          radius={[0, 8, 8, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </div>
  );
}
