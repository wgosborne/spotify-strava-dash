import { prisma } from "@/lib/prisma";
import { getFastestSplitWithSong } from "@/lib/matchSongToSplit";

function formatDate(date: Date): string {
  return date.toLocaleString();
}

function speedToPace(metersPerSecond: number): string {
  const secondsPerMile = 1609.34 / metersPerSecond;
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.floor(secondsPerMile % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
}

function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

export default async function InsightsPage() {
  const activities = await prisma.activities.findMany({
    orderBy: {
      start_date: "desc",
    },
    take: 50,
  });

  const activityInsights = await Promise.all(
    activities.map(async (activity) => {
      const totalSplits = await prisma.splits.count({
        where: {
          activity_id: activity.strava_id,
        },
      });

      const sampleSplits = await prisma.splits.findMany({
        where: {
          activity_id: activity.strava_id,
        },
        take: 3,
        orderBy: {
          split_number: "asc",
        },
      });

      const splitSongMatch = await getFastestSplitWithSong(
        activity.strava_id.toString()
      );

      return {
        activity,
        totalSplits,
        sampleSplits,
        splitSongMatch,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">
        Songs I Ran Fastest To
      </h1>

      {activityInsights.length > 0 && (
        <div className="mb-8 p-4 bg-dark border border-dark rounded-lg text-spotify-green text-sm">
          <p className="font-semibold mb-3">DEBUG: Raw split distances for first activity</p>
          <div className="space-y-1">
            {activityInsights[0].sampleSplits.map((split) => (
              <p key={split.id} className="font-mono text-xs">
                Split {split.split_number}: {split.distance.toString()} (raw), {Number(split.distance).toFixed(2)} (as number)
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {activityInsights.map(({ activity, totalSplits, splitSongMatch }) => (
          <div
            key={activity.id}
            className="border border-dark rounded-lg p-6 bg-dark hover:bg-dark/80 transition"
          >
            <h2 className="text-xl md:text-2xl font-bold text-spotify-green mb-2">
              {activity.name}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {formatDate(activity.start_date)}
            </p>

            {totalSplits > 0 && (
              <p className="text-gray-400 text-xs mb-4">
                Splits are measured every 1 km
              </p>
            )}

            {splitSongMatch ? (
              <>
                <div className="mb-6 space-y-2">
                  <p className="text-gray-300">
                    <span className="text-spotify-green font-semibold">Fastest Split:</span> Split {splitSongMatch.split.splitNumber} of {totalSplits}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-spotify-green font-semibold">Pace:</span> <span className="font-mono">{speedToPace(splitSongMatch.split.averageSpeed)}</span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-spotify-green font-semibold">Distance:</span> {metersToMiles(splitSongMatch.split.distance).toFixed(2)} mi
                  </p>
                </div>

                {splitSongMatch.songs.length > 0 ? (
                  <div>
                    <p className="text-spotify-green font-semibold mb-3">Songs Playing:</p>
                    <ul className="space-y-2">
                      {splitSongMatch.songs.map((song, idx) => (
                        <li key={idx} className="text-gray-400 text-sm">
                          <span className="text-gray-300">{song.trackName}</span>
                          <span className="text-gray-600"> by </span>
                          <span className="text-gray-400">{song.artist}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-600 italic text-sm">
                    No song data for this time window
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600 italic text-sm">
                No split data available
              </p>
            )}
          </div>
        ))}
      </div>

      {activityInsights.length === 0 && (
        <p className="text-gray-500 text-center">No activities found.</p>
      )}
    </div>
  );
}
