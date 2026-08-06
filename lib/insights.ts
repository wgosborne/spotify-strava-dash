import { prisma } from "./prisma";

interface Song {
  trackName: string;
  artist: string;
}

interface SongWithPace extends Song {
  pace: string;
}

interface SongWithPaceAndActivity extends SongWithPace {
  activityName: string;
  activityDate: Date;
  activityDescription: string | null;
}

interface FastestSplitResult {
  splitNumber: number;
  activityName: string;
  activityDate: Date;
  activityDescription: string | null;
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

export async function getTopSongsByPace(limit = 5): Promise<SongWithPaceAndActivity[]> {
  // Use a single SQL query with window functions to find fastest pace for each song
  // Filters unreliable splits at database level (distance >= 400m, pace <= 5:20/mi)
  const results = await prisma.$queryRaw<
    Array<{
      track_name: string;
      artist: string;
      fastest_average_speed: number;
      activity_name: string;
      activity_start_date: Date;
      activity_description: string | null;
    }>
  >`
    WITH song_splits AS (
      SELECT
        p.track_name,
        p.artist,
        s.average_speed,
        a.name as activity_name,
        a.start_date as activity_start_date,
        a.description as activity_description,
        ROW_NUMBER() OVER (PARTITION BY p.track_name, p.artist ORDER BY s.average_speed DESC) as rn
      FROM activities a
      JOIN splits s ON s.activity_id = a.strava_id
      JOIN plays p ON p.played_at >= a.start_date + (interval '1 second' * s.start_offset_seconds)
                  AND p.played_at < a.start_date + (interval '1 second' * (s.start_offset_seconds + s.elapsed_time))
      WHERE
        s.distance >= 400
        AND s.average_speed <= 5.03
    )
    SELECT
      track_name,
      artist,
      average_speed as fastest_average_speed,
      activity_name,
      activity_start_date,
      activity_description
    FROM song_splits
    WHERE rn = 1
    ORDER BY fastest_average_speed DESC
    LIMIT ${limit}
  `;

  return results.map((item) => ({
    trackName: item.track_name,
    artist: item.artist,
    pace: speedToPace(Number(item.fastest_average_speed)),
    activityName: item.activity_name,
    activityDate: item.activity_start_date,
    activityDescription: item.activity_description,
  }));
}

export async function getOverallFastestSplit(): Promise<FastestSplitResult | null> {
  // Find the fastest reliable split across all activities
  const fastestSplitResult = await prisma.$queryRaw<
    Array<{
      split_number: number;
      activity_strava_id: bigint;
      activity_name: string;
      activity_start_date: Date;
      activity_description: string | null;
      average_speed: number;
      distance: number;
      start_offset_seconds: number;
      elapsed_time: number;
    }>
  >`
    SELECT
      s.split_number,
      a.strava_id as activity_strava_id,
      a.name as activity_name,
      a.start_date as activity_start_date,
      a.description as activity_description,
      s.average_speed,
      s.distance,
      s.start_offset_seconds,
      s.elapsed_time
    FROM activities a
    JOIN splits s ON s.activity_id = a.strava_id
    WHERE
      s.distance >= 400
      AND s.average_speed <= 5.03
    ORDER BY s.average_speed DESC
    LIMIT 1
  `;

  if (fastestSplitResult.length === 0) {
    return null;
  }

  const split = fastestSplitResult[0];
  const splitStartTime = new Date(
    split.activity_start_date.getTime() + split.start_offset_seconds * 1000
  );
  const splitEndTime = new Date(
    splitStartTime.getTime() + split.elapsed_time * 1000
  );

  // Fetch songs for this specific split
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
    splitNumber: split.split_number,
    activityName: split.activity_name,
    activityDate: split.activity_start_date,
    activityDescription: split.activity_description,
    activityStravaId: split.activity_strava_id,
    pace: speedToPace(Number(split.average_speed)),
    distance: metersToMiles(Number(split.distance)),
    songs: songs.map((s) => ({
      trackName: s.track_name,
      artist: s.artist,
    })),
  };
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const totalActivities = await prisma.activities.count();
  const totalPlays = await prisma.plays.count();

  // Count distinct songs matched to realistic splits (distance >= 400m, pace <= 5:20/mi)
  const matchedSongsResult = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(DISTINCT (p.track_name, p.artist)) as count
    FROM activities a
    JOIN splits s ON s.activity_id = a.strava_id
    JOIN plays p ON p.played_at >= a.start_date + (interval '1 second' * s.start_offset_seconds)
                AND p.played_at < a.start_date + (interval '1 second' * (s.start_offset_seconds + s.elapsed_time))
    WHERE
      s.distance >= 400
      AND s.average_speed <= 5.03
  `;

  const totalDistinctSongsMatched = Number(
    matchedSongsResult[0]?.count || 0
  );

  return {
    totalActivities,
    totalPlays,
    totalDistinctSongsMatched,
  };
}

export async function getPaceBySong(): Promise<SongPaceData[]> {
  // Use a single SQL query to find fastest pace for each song
  const results = await prisma.$queryRaw<
    Array<{
      track_name: string;
      artist: string;
      fastest_average_speed: number;
    }>
  >`
    WITH song_splits AS (
      SELECT
        p.track_name,
        p.artist,
        s.average_speed,
        ROW_NUMBER() OVER (PARTITION BY p.track_name, p.artist ORDER BY s.average_speed DESC) as rn
      FROM activities a
      JOIN splits s ON s.activity_id = a.strava_id
      JOIN plays p ON p.played_at >= a.start_date + (interval '1 second' * s.start_offset_seconds)
                  AND p.played_at < a.start_date + (interval '1 second' * (s.start_offset_seconds + s.elapsed_time))
      WHERE
        s.distance >= 400
        AND s.average_speed <= 5.03
    )
    SELECT
      track_name,
      artist,
      average_speed as fastest_average_speed
    FROM song_splits
    WHERE rn = 1
    ORDER BY fastest_average_speed DESC
    LIMIT 15
  `;

  return results.map((item) => {
    const metersPerSecond = Number(item.fastest_average_speed);
    const paceInSecondsPerMile = 1609.34 / metersPerSecond;
    return {
      trackName: item.track_name,
      artist: item.artist,
      pace: speedToPace(metersPerSecond),
      paceInSecondsPerMile,
    };
  });
}
