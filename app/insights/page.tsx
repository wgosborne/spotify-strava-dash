import {
  getPaceOverTime,
  getArtistBreakdown,
  getRunFrequency,
  getDistanceVsPace,
} from "@/lib/insights";
import { PaceOverTimeChart } from "@/app/components/PaceOverTimeChart";
import { ArtistBreakdownChart } from "@/app/components/ArtistBreakdownChart";
import { RunFrequencyHeatmap } from "@/app/components/RunFrequencyHeatmap";
import { DistanceVsPaceChart } from "@/app/components/DistanceVsPaceChart";

export default async function InsightsPage() {
  const [paceOverTime, artistBreakdown, runFrequency, distanceVsPace] =
    await Promise.all([
      getPaceOverTime(),
      getArtistBreakdown(10),
      getRunFrequency(),
      getDistanceVsPace(),
    ]);

  const dateRangeStart = paceOverTime[0]?.date.toLocaleDateString() || "";
  const dateRangeEnd =
    paceOverTime[paceOverTime.length - 1]?.date.toLocaleDateString() || "";
  const dateRange =
    dateRangeStart && dateRangeEnd
      ? `${dateRangeStart} — ${dateRangeEnd}`
      : "No data";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-12 text-white">
        Insights
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pace Over Time */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Pace Over Time</h2>
              <p className="text-gray-400 text-xs mt-1">{dateRange}</p>
            </div>
            {paceOverTime.length > 0 ? (
              <PaceOverTimeChart data={paceOverTime} dateRange={dateRange} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Artist Breakdown */}
        <div>
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                Who You Run Fastest To
              </h2>
            </div>
            {artistBreakdown.length > 0 ? (
              <ArtistBreakdownChart data={artistBreakdown} />
            ) : (
              <div className="p-4 text-gray-500 text-sm">
                No artist data available
              </div>
            )}
          </div>
        </div>

        {/* Run Frequency Heatmap */}
        <div>
          <div className="glass-panel rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Run Consistency</h2>
            </div>
            {runFrequency.length > 0 ? (
              <RunFrequencyHeatmap data={runFrequency} />
            ) : (
              <div className="text-gray-500 text-sm">No frequency data</div>
            )}
          </div>
        </div>

        {/* Distance vs Pace */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                Distance vs Pace
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                {distanceVsPace.length} splits analyzed
              </p>
            </div>
            {distanceVsPace.length > 0 ? (
              <DistanceVsPaceChart data={distanceVsPace} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
