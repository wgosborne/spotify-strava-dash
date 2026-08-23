"use client";

interface ArtistBreakdownChartProps {
  data: Array<{
    artist: string;
    count: number;
  }>;
}

export function ArtistBreakdownChart({ data }: ArtistBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No artist data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-0">
      {data.map((item, idx) => {
        const barWidth = (item.count / maxCount) * 100;

        return (
          <div
            key={idx}
            className={`p-4 ${
              idx < data.length - 1 ? "border-b border-white/10" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate mb-2">
                  {item.artist}
                </p>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spotify-green rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
              <p className="text-spotify-green font-bold text-sm shrink-0 w-8 text-right">
                {item.count}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
