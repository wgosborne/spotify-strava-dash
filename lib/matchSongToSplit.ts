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

  // Find the split with the highest average speed
  const fastestSplit = await prisma.splits.findFirst({
    where: {
      activity_id: stravaId,
    },
    orderBy: {
      average_speed: "desc",
    },
  });

  if (!fastestSplit) {
    return null;
  }

  // Get the activity to find its start_date
  const activity = await prisma.activities.findUnique({
    where: {
      strava_id: stravaId,
    },
  });

  if (!activity) {
    return null;
  }

  // Calculate real-world start and end timestamps of the split
  const splitStartTime = new Date(
    activity.start_date.getTime() +
      fastestSplit.start_offset_seconds * 1000
  );
  const splitEndTime = new Date(
    splitStartTime.getTime() + fastestSplit.elapsed_time * 1000
  );

  // Find songs that were playing during this split
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
      splitNumber: fastestSplit.split_number,
      averageSpeed: Number(fastestSplit.average_speed),
      distance: Number(fastestSplit.distance),
    },
    songs: songs.map((song) => ({
      trackName: song.track_name,
      artist: song.artist,
    })),
  };
}
