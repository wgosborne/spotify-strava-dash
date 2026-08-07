import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
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

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: PageParams) {
  const { id } = await params;
  const stravaId = BigInt(id);

  const activity = await prisma.activities.findUnique({
    where: {
      strava_id: stravaId,
    },
  });

  if (!activity) {
    notFound();
  }

  const splits = await prisma.splits.findMany({
    where: {
      activity_id: stravaId,
    },
    orderBy: {
      split_number: "asc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <Link href="/runs" className="text-spotify-green hover:opacity-80 mb-6 inline-block">
        ← Back to Runs
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">{activity.name}</h1>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-dark rounded-lg p-4 bg-dark/50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
          <p className="text-spotify-green font-medium text-sm">{activity.start_date.toLocaleDateString()}</p>
          <p className="text-gray-600 text-xs">{activity.start_date.toLocaleTimeString()}</p>
        </div>
        <div className="border border-dark rounded-lg p-4 bg-dark/50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Distance</p>
          <p className="text-spotify-green font-medium text-lg">{metersToMiles(Number(activity.distance)).toFixed(2)} <span className="text-sm">mi</span></p>
        </div>
        <div className="border border-dark rounded-lg p-4 bg-dark/50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Moving Time</p>
          <p className="text-spotify-green font-medium text-lg">{formatMovingTime(activity.moving_time)}</p>
        </div>
        <div className="border border-dark rounded-lg p-4 bg-dark/50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pace</p>
          <p className="text-spotify-green font-medium font-mono text-lg">{speedToPace(Number(activity.average_speed))}</p>
        </div>
      </div>

      {/* Description section */}
      {activity.description && (
        <div className="mb-8 relative rounded-lg border border-spotify-green/30 bg-dark/50 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-spotify-green/5 to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-spotify-green text-xs uppercase tracking-widest font-semibold mb-3">
              Run Notes
            </p>
            <p className="text-gray-200 text-base leading-relaxed">
              {activity.description}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-white">Splits</h2>

      {splits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="border-b border-dark">
                <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                  Split #
                </th>
                <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                  Distance (mi)
                </th>
                <th className="text-left py-3 px-4 font-semibold text-spotify-green hidden sm:table-cell">
                  Elapsed Time
                </th>
                <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                  Pace
                </th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split, idx) => (
                <tr
                  key={split.id}
                  className={`border-b border-dark ${
                    idx % 2 === 0 ? "bg-dark" : "bg-black"
                  } hover:bg-dark/80 transition`}
                >
                  <td className="py-3 px-4 text-gray-400 font-medium">{split.split_number}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {metersToMiles(Number(split.distance)).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 hidden sm:table-cell text-sm">
                    {formatMovingTime(split.elapsed_time)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono text-sm">
                    {speedToPace(Number(split.average_speed))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No splits found for this activity.</p>
      )}
    </div>
  );
}
