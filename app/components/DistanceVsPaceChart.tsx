"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DistanceVsPaceChartProps {
  data: Array<{
    distance: number;
    paceSeconds: number;
  }>;
}

function formatPaceLabel(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
}

export function DistanceVsPaceChart({ data }: DistanceVsPaceChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 30, left: 60 }}
        >
          <XAxis
            dataKey="distance"
            type="number"
            name="Distance (mi)"
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fontSize: 11, fill: "#d1d5db" }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            tickLine={false}
            label={{
              value: "Distance (mi)",
              position: "bottom",
              offset: 10,
              fill: "#d1d5db",
              fontSize: 12,
            }}
          />
          <YAxis
            dataKey="paceSeconds"
            type="number"
            name="Pace"
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fontSize: 11, fill: "#d1d5db" }}
            tickFormatter={formatPaceLabel}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            tickLine={false}
            width={60}
            label={{
              value: "Pace (/mi)",
              angle: -90,
              position: "insideLeft",
              fill: "#d1d5db",
              fontSize: 12,
            }}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (typeof value !== "number") return value;
              if (name === "Pace") {
                return formatPaceLabel(value);
              }
              return value.toFixed(2);
            }}
            labelFormatter={() => ""}
            contentStyle={{
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
          />
          <Scatter
            name="Splits"
            data={data}
            fill="rgba(29, 185, 84, 0.3)"
            dataKey="paceSeconds"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
