import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

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

  // Get splits ordered by pace (fastest first)
  const splitsByPace = await prisma.splits.findMany({
    where: {
      activity_id: stravaId,
    },
    orderBy: {
      average_speed: "desc",
    },
  });

  // For each split, find matching songs
  const splitsWithSongs = await Promise.all(
    splitsByPace.map(async (split) => {
      const splitStartTime = new Date(
        activity.start_date.getTime() + split.start_offset_seconds * 1000
      );
      const splitEndTime = new Date(
        splitStartTime.getTime() + split.elapsed_time * 1000
      );

      const matchedSongs = await prisma.plays.findMany({
        where: {
          played_at: {
            gte: splitStartTime,
            lte: splitEndTime,
          },
        },
        orderBy: {
          played_at: "asc",
        },
      });

      return {
        ...split,
        matchedSongs,
        splitStartTime,
        splitEndTime,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <Link href="/runs" className="text-spotify-green hover:opacity-80 mb-6 inline-block">
        ← Back to Runs
      </Link>

      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">{activity.name}</h1>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-lg p-4">
          <p className="text-sm text-white uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Date</p>
          <p className="text-spotify-green font-bold text-base leading-tight">{activity.start_date.toLocaleDateString()}</p>
          <p className="text-white text-sm font-light">{activity.start_date.toLocaleTimeString()}</p>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <p className="text-sm text-white uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Distance</p>
          <p className="text-spotify-green font-bold text-xl leading-tight">{metersToMiles(Number(activity.distance)).toFixed(2)} <span className="text-base">mi</span></p>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <p className="text-sm text-white uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Moving Time</p>
          <p className="text-spotify-green font-bold text-xl leading-tight">{formatMovingTime(activity.moving_time)}</p>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <p className="text-sm text-white uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Pace</p>
          <p className="text-spotify-green font-bold font-mono text-xl leading-tight">{speedToPace(Number(activity.average_speed))}</p>
        </div>
      </div>

      {/* Description section */}
      {activity.description && (
        <div className="mb-8 relative rounded-lg glass-panel p-6 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-spotify-green/5 to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-spotify-green text-sm uppercase tracking-widest font-light mb-3">
              Run Notes
            </p>
            <p className="text-white text-base leading-relaxed font-light">
              {activity.description}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 text-white leading-tight">Fastest Splits</h2>

      {splitsWithSongs.length > 0 ? (
        <div className="mb-12 flex flex-col gap-4">
          {splitsWithSongs.map((split) => (
            <div
              key={split.id}
              className="glass-panel rounded-lg p-4 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Accent wash */}
              <div className="absolute inset-0 bg-linear-to-l from-spotify-green/10 to-transparent pointer-events-none" />

              <div className="relative">
                {/* Split header */}
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm uppercase tracking-widest font-light mb-2">
                        Split {split.split_number}
                      </p>
                      {/* Secondary stats: distance and time */}
                      <div className="flex gap-3 text-white text-sm font-light">
                        <span>{metersToMiles(Number(split.distance)).toFixed(2)} mi</span>
                        <span className="opacity-50">•</span>
                        <span>{formatMovingTime(split.elapsed_time)}</span>
                      </div>
                    </div>
                    {/* Pace - the hero element */}
                    <div className="shrink-0 sm:text-right">
                      <p className="text-spotify-green font-mono font-bold text-3xl leading-tight">
                        {speedToPace(Number(split.average_speed))}
                      </p>
                    </div>
                  </div>
                  {/* Matched songs divider */}
                  {split.matchedSongs.length > 0 && (
                    <div className="border-t border-white/10" />
                  )}
                </div>

                {/* Matched songs */}
                <div>
                  {split.matchedSongs.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-white text-sm uppercase tracking-widest font-light">
                        Songs Playing
                      </p>
                      {split.matchedSongs.map((song, idx) => (
                        <div key={song.id} className="flex gap-3 items-start">
                          {/* Album art */}
                          <div className="shrink-0 relative w-12 h-12 rounded overflow-hidden bg-gray-800">
                            {song.album_art_url ? (
                              <Image
                                src={song.album_art_url}
                                alt={song.track_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm2 1a1 1 0 100-2 1 1 0 000 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Song info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-tight">
                              {song.track_name}
                            </p>
                            <p className="text-white text-xs font-light">
                              {song.artist}
                            </p>
                            <p className="text-white text-xs font-light mt-1">
                              {song.played_at.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white text-sm font-light italic">
                      No song data
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="text-3xl font-bold mb-6 text-white leading-tight">Splits</h2>

      {splits.length > 0 ? (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm md:text-base glass-panel">
            <thead>
              <tr className="border-b glass-border">
                <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  Split #
                </th>
                <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  Distance (mi)
                </th>
                <th className="text-left py-3 px-4 font-bold text-spotify-green hidden sm:table-cell text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  Elapsed Time
                </th>
                <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  Pace
                </th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split, idx) => (
                <tr
                  key={split.id}
                  className={`${
                    idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'
                  } hover:bg-[rgba(255,255,255,0.08)] transition`}
                >
                  <td className="py-3 px-4 text-white font-bold text-base">{split.split_number}</td>
                  <td className="py-3 px-4 text-white font-bold text-base">
                    {metersToMiles(Number(split.distance)).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-white hidden sm:table-cell text-base font-light">
                    {formatMovingTime(split.elapsed_time)}
                  </td>
                  <td className="py-3 px-4 text-white font-mono font-bold text-base">
                    {speedToPace(Number(split.average_speed))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-white">No splits found for this activity.</p>
      )}
    </div>
  );
}
