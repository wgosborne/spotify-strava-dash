"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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

  const chartHeight = Math.max(data.length * 30, 300);

  return (
    <div className="w-full" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 150, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="none"
            tick={false}
            axisLine={false}
          />
          <YAxis
            dataKey="displayName"
            type="category"
            width={140}
            stroke="none"
            tick={{ fontSize: 11, fill: "#d1d5db" }}
            axisLine={false}
            interval={0}
          />
          <Tooltip
            formatter={(value: number) => formatPaceLabel(value)}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.displayName === label);
              return item ? item.fullName : "";
            }}
            contentStyle={{
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
            cursor={{ stroke: "rgba(255, 255, 255, 0.1)" }}
          />
          <Line
            dataKey="paceInSecondsPerMile"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
