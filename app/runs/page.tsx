import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

export default async function RunsPage() {
  const activities = await prisma.activities.findMany({
    orderBy: {
      start_date: "desc",
    },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">Recent Runs</h1>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/runs/${activity.strava_id}`}
            className="block"
          >
            <div className="relative rounded-lg border border-dark bg-dark overflow-hidden hover:border-spotify-green/50 transition group p-4">
              {/* Accent wash */}
              <div className="absolute inset-0 bg-linear-to-l from-spotify-green/10 to-transparent pointer-events-none" />

              <div className="relative">
                {/* Header row with name and key stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-spotify-green hover:underline font-semibold text-base">
                      {activity.name}
                    </h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="shrink-0">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Distance</p>
                      <p className="text-white font-medium">
                        {metersToMiles(Number(activity.distance)).toFixed(2)} mi
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Pace</p>
                      <p className="text-white font-mono font-medium">
                        {speedToPace(Number(activity.average_speed))}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Time</p>
                      <p className="text-white font-medium">
                        {formatMovingTime(activity.moving_time)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Date</p>
                      <p className="text-white font-medium text-sm">
                        {activity.start_date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description section */}
                {activity.description && (
                  <div className="pt-3 border-t border-dark/50">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {activities.length === 0 && (
        <p className="mt-8 text-gray-500 text-center">No activities found.</p>
      )}
    </div>
  );
}
