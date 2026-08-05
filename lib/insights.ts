import { prisma } from "./prisma";

interface Song {
  trackName: string;
  artist: string;
}

interface SongWithPace extends Song {
  pace: string;
}

interface FastestSplitResult {
  splitNumber: number;
  activityName: string;
  activityDate: Date;
  activityStravaId: bigint;
  pace: string;
  distance: number;
  songs: Song[];
}

interface SummaryStats {
  totalActivities: number;
  totalPlays: number;
  totalDistinctSongsMatched: number;
}

interface SongPaceData {
  trackName: string;
  artist: string;
  pace: string;
  paceInSecondsPerMile: number;
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

export async function getTopSongsByPace(limit = 5): Promise<SongWithPace[]> {
  const activities = await prisma.activities.findMany();

  const songMap = new Map<
    string,
    { trackName: string; artist: string; paceInSecondsPerMile: number }
  >();

  for (const activity of activities) {
    const splits = await prisma.splits.findMany({
      where: { activity_id: activity.strava_id },
    });

    for (const split of splits) {
      const splitStartTime = new Date(
        activity.start_date.getTime() + split.start_offset_seconds * 1000
      );
      const splitEndTime = new Date(
        splitStartTime.getTime() + split.elapsed_time * 1000
      );

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

      const paceInSecondsPerMile = 1609.34 / Number(split.average_speed);

      for (const song of songs) {
        const key = `${song.track_name}||${song.artist}`;
        const current = songMap.get(key);

        if (!current || paceInSecondsPerMile < current.paceInSecondsPerMile) {
          songMap.set(key, {
            trackName: song.track_name,
            artist: song.artist,
            paceInSecondsPerMile,
          });
        }
      }
    }
  }

  const sorted = Array.from(songMap.values())
    .sort((a, b) => a.paceInSecondsPerMile - b.paceInSecondsPerMile)
    .slice(0, limit);

  return sorted.map((item) => ({
    trackName: item.trackName,
    artist: item.artist,
    pace: speedToPace(1609.34 / item.paceInSecondsPerMile),
  }));
}

export async function getOverallFastestSplit(): Promise<FastestSplitResult | null> {
  const activities = await prisma.activities.findMany();

  let fastestSplit = null;
  let fastestActivity = null;
  let fastestSpeed = -1;

  for (const activity of activities) {
    const splits = await prisma.splits.findMany({
      where: { activity_id: activity.strava_id },
    });

    for (const split of splits) {
      const speed = Number(split.average_speed);
      if (speed > fastestSpeed) {
        fastestSpeed = speed;
        fastestSplit = split;
        fastestActivity = activity;
      }
    }
  }

  if (!fastestSplit || !fastestActivity) {
    return null;
  }

  const splitStartTime = new Date(
    fastestActivity.start_date.getTime() +
      fastestSplit.start_offset_seconds * 1000
  );
  const splitEndTime = new Date(
    splitStartTime.getTime() + fastestSplit.elapsed_time * 1000
  );

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
    splitNumber: fastestSplit.split_number,
    activityName: fastestActivity.name,
    activityDate: fastestActivity.start_date,
    activityStravaId: fastestActivity.strava_id,
    pace: speedToPace(fastestSpeed),
    distance: metersToMiles(Number(fastestSplit.distance)),
    songs: songs.map((s) => ({
      trackName: s.track_name,
      artist: s.artist,
    })),
  };
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const totalActivities = await prisma.activities.count();
  const totalPlays = await prisma.plays.count();

  const activities = await prisma.activities.findMany();
  const matchedSongs = new Set<string>();

  for (const activity of activities) {
    const splits = await prisma.splits.findMany({
      where: { activity_id: activity.strava_id },
    });

    for (const split of splits) {
      const splitStartTime = new Date(
        activity.start_date.getTime() + split.start_offset_seconds * 1000
      );
      const splitEndTime = new Date(
        splitStartTime.getTime() + split.elapsed_time * 1000
      );

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

      for (const song of songs) {
        matchedSongs.add(`${song.track_name}||${song.artist}`);
      }
    }
  }

  return {
    totalActivities,
    totalPlays,
    totalDistinctSongsMatched: matchedSongs.size,
  };
}

export async function getPaceBySong(): Promise<SongPaceData[]> {
  const activities = await prisma.activities.findMany();

  const songMap = new Map<
    string,
    { trackName: string; artist: string; paceInSecondsPerMile: number }
  >();

  for (const activity of activities) {
    const splits = await prisma.splits.findMany({
      where: { activity_id: activity.strava_id },
    });

    for (const split of splits) {
      const splitStartTime = new Date(
        activity.start_date.getTime() + split.start_offset_seconds * 1000
      );
      const splitEndTime = new Date(
        splitStartTime.getTime() + split.elapsed_time * 1000
      );

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

      const paceInSecondsPerMile = 1609.34 / Number(split.average_speed);

      for (const song of songs) {
        const key = `${song.track_name}||${song.artist}`;
        const current = songMap.get(key);

        if (!current || paceInSecondsPerMile < current.paceInSecondsPerMile) {
          songMap.set(key, {
            trackName: song.track_name,
            artist: song.artist,
            paceInSecondsPerMile,
          });
        }
      }
    }
  }

  const sorted = Array.from(songMap.values())
    .sort((a, b) => a.paceInSecondsPerMile - b.paceInSecondsPerMile)
    .slice(0, 15);

  return sorted.map((item) => ({
    trackName: item.trackName,
    artist: item.artist,
    pace: speedToPace(1609.34 / item.paceInSecondsPerMile),
    paceInSecondsPerMile: item.paceInSecondsPerMile,
  }));
}
