import { prisma } from "./prisma";

interface SplitSongMatch {
  split: {
    splitNumber: number;
    averageSpeed: number;
    distance: number;
  };
  songs: Array<{
    trackName: string;
    artist: string;
  }>;
}

export async function getFastestSplitWithSong(
  activityId: string
): Promise<SplitSongMatch | null> {
  const stravaId = BigInt(activityId);

  // Find the fastest reliable split using a single SQL query
  const fastestSplitResult = await prisma.$queryRaw<
    Array<{
      split_number: number;
      average_speed: number;
      distance: number;
      start_offset_seconds: number;
      elapsed_time: number;
      activity_start_date: Date;
    }>
  >`
    SELECT
      s.split_number,
      s.average_speed,
      s.distance,
      s.start_offset_seconds,
      s.elapsed_time,
      a.start_date as activity_start_date
    FROM splits s
    JOIN activities a ON s.activity_id = a.strava_id
    WHERE
      s.activity_id = ${stravaId}
      AND s.distance >= 1448.406
      AND s.average_speed <= 8.94
    ORDER BY s.average_speed DESC
    LIMIT 1
  `;

  if (fastestSplitResult.length === 0) {
    return null;
  }

  const split = fastestSplitResult[0];

  // Calculate split time window
  const splitStartTime = new Date(
    split.activity_start_date.getTime() + split.start_offset_seconds * 1000
  );
  const splitEndTime = new Date(
    splitStartTime.getTime() + split.elapsed_time * 1000
  );

  // Find songs during this split
  const songs = await prisma.plays.findMany({
    where: {
      played_at: {
        gte: splitStartTime,
        lte: splitEndTime,
      },
    },
    select: {
      track_name: true,
      artist: true,
    },
  });

  return {
    split: {
      splitNumber: split.split_number,
      averageSpeed: Number(split.average_speed),
      distance: Number(split.distance),
    },
    songs: songs.map((song) => ({
      trackName: song.track_name,
      artist: song.artist,
    })),
  };
}
