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
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">Recent Runs</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="border-b border-dark">
              <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                Activity Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green hidden sm:table-cell">
                Distance (mi)
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green hidden md:table-cell">
                Moving Time
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                Pace
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green hidden lg:table-cell">
                Start Date
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, idx) => (
              <tr
                key={activity.id}
                className={`border-b border-dark ${
                  idx % 2 === 0 ? "bg-dark" : "bg-black"
                } hover:bg-dark/80 transition`}
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/runs/${activity.strava_id}`}
                    className="text-spotify-green hover:underline font-medium"
                  >
                    {activity.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-400 hidden sm:table-cell text-sm">
                  {metersToMiles(Number(activity.distance)).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-gray-400 hidden md:table-cell text-sm">
                  {formatMovingTime(activity.moving_time)}
                </td>
                <td className="py-3 px-4 text-gray-400 font-mono text-sm">
                  {speedToPace(Number(activity.average_speed))}
                </td>
                <td className="py-3 px-4 text-gray-500 hidden lg:table-cell text-xs">
                  {activity.start_date.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activities.length === 0 && (
        <p className="mt-8 text-gray-500 text-center">No activities found.</p>
      )}
    </div>
  );
}
