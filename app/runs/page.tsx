import { prisma } from "@/lib/prisma";
import RunRow from "./run-row";

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

  // Format data on server side to pass to client component
  const plainActivities = activities.map((activity) => ({
    id: activity.id,
    strava_id: activity.strava_id,
    name: activity.name,
    description: activity.description || "",
    start_date: activity.start_date.toLocaleDateString(),
    distance: metersToMiles(Number(activity.distance)).toFixed(2),
    pace: speedToPace(Number(activity.average_speed)),
    time: formatMovingTime(activity.moving_time),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">Recent Runs</h1>

      <div className="space-y-3">
        {plainActivities.map((activity) => (
          <RunRow
            key={activity.id}
            activity={activity}
          />
        ))}
      </div>

      {plainActivities.length === 0 && (
        <p className="mt-8 text-gray-500 text-center">No activities found.</p>
      )}
    </div>
  );
}
