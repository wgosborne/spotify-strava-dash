"use client";

interface RunFrequencyHeatmapProps {
  data: Array<{
    date: Date;
    count: number;
  }>;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getHeatColor(count: number, maxCount: number): string {
  if (count === 0) return "rgba(255, 255, 255, 0.05)";
  const intensity = count / maxCount;
  if (intensity > 0.75) return "#1db954";
  if (intensity > 0.5) return "rgba(29, 185, 84, 0.7)";
  if (intensity > 0.25) return "rgba(29, 185, 84, 0.4)";
  return "rgba(29, 185, 84, 0.15)";
}

export function RunFrequencyHeatmap({ data }: RunFrequencyHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No frequency data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Create a map of dates to counts
  const dateMap = new Map<string, number>();
  data.forEach((item) => {
    const dateStr = item.date.toISOString().split("T")[0];
    dateMap.set(dateStr, item.count);
  });

  // Get date range
  const minDate = new Date(data[0].date);
  const maxDate = new Date(data[data.length - 1].date);

  // Generate all weeks starting from the first Sunday before minDate
  const weeks: (Date | null)[][] = [];
  let currentDate = new Date(minDate);
  currentDate.setDate(currentDate.getDate() - currentDate.getDay());

  while (currentDate <= maxDate) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (currentDate <= maxDate) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        week.push(null);
      }
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Day labels */}
        <div className="flex gap-1 mb-2 pl-12">
          {DAYS.map((day) => (
            <div
              key={day}
              className="w-3 text-center text-xs text-gray-500 font-semibold"
            >
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {/* Weeks columns */}
          <div className="flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((date, dayIdx) => {
                  if (!date) {
                    return (
                      <div
                        key={dayIdx}
                        className="w-3 h-3 rounded-sm opacity-0"
                      />
                    );
                  }

                  const dateStr = date.toISOString().split("T")[0];
                  const count = dateMap.get(dateStr) || 0;
                  const bgColor = getHeatColor(count, maxCount);

                  return (
                    <div
                      key={dayIdx}
                      className="w-3 h-3 rounded-sm transition-all hover:ring-1 hover:ring-white/30 cursor-help"
                      style={{ backgroundColor: bgColor }}
                      title={`${date.toLocaleDateString()}: ${count} run${count !== 1 ? "s" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Month labels */}
          <div className="ml-2 flex flex-col justify-end text-xs text-gray-600 font-semibold">
            {/* This is simplified - just shows a few key months */}
            <div className="h-12 flex items-end">
              {minDate.toLocaleDateString("en-US", { month: "short" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
