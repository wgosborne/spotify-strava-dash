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
  splitDistanceMeters: number;
  albumArtUrl: string | null;
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

let statsCache: { data: SummaryStats; timestamp: number } | null = null;
const STATS_CACHE_TTL = 3600000; // 1 hour in milliseconds

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
  const results = await prisma.$queryRaw<
    Array<{
      track_name: string;
      artist: string;
      fastest_average_speed: number;
      activity_name: string;
      activity_start_date: Date;
      activity_description: string | null;
      distance: number;
      album_art_url: string | null;
    }>
  >`
    WITH filtered_splits AS (
      SELECT
        s.average_speed,
        s.distance,
        s.start_offset_seconds,
        s.elapsed_time,
        a.strava_id,
        a.name as activity_name,
        a.start_date as activity_start_date,
        a.description as activity_description
      FROM splits s
      INNER JOIN activities a ON s.activity_id = a.strava_id
      WHERE s.distance >= 400 AND s.average_speed <= 5.03
    ),
    song_splits AS (
      SELECT
        p.track_name,
        p.artist,
        p.album_art_url,
        fs.average_speed,
        fs.distance,
        fs.activity_name,
        fs.activity_start_date,
        fs.activity_description,
        ROW_NUMBER() OVER (PARTITION BY p.track_name, p.artist ORDER BY fs.average_speed DESC) as rn
      FROM filtered_splits fs
      CROSS JOIN LATERAL (
        SELECT track_name, artist, album_art_url
        FROM plays
        WHERE played_at >= fs.activity_start_date + (interval '1 second' * fs.start_offset_seconds)
          AND played_at < fs.activity_start_date + (interval '1 second' * (fs.start_offset_seconds + fs.elapsed_time))
        OFFSET 0
      ) p
    )
    SELECT
      track_name,
      artist,
      average_speed as fastest_average_speed,
      distance,
      album_art_url,
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
    splitDistanceMeters: Number(item.distance),
    albumArtUrl: item.album_art_url,
  }));
}

export async function getOverallFastestSplit(): Promise<FastestSplitResult | null> {
  const result = await prisma.$queryRaw<
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
      track_name: string | null;
      artist: string | null;
    }>
  >`
    WITH fastest_split AS (
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
    )
    SELECT
      fs.split_number,
      fs.activity_strava_id,
      fs.activity_name,
      fs.activity_start_date,
      fs.activity_description,
      fs.average_speed,
      fs.distance,
      fs.start_offset_seconds,
      fs.elapsed_time,
      p.track_name,
      p.artist
    FROM fastest_split fs
    LEFT JOIN plays p ON
      p.played_at >= fs.activity_start_date + (interval '1 second' * fs.start_offset_seconds)
      AND p.played_at < fs.activity_start_date + (interval '1 second' * (fs.start_offset_seconds + fs.elapsed_time))
  `;

  if (result.length === 0) {
    return null;
  }

  const splitData = result[0];
  const songs = result
    .filter(r => r.track_name !== null)
    .map(r => ({
      trackName: r.track_name!,
      artist: r.artist!,
    }));

  return {
    splitNumber: splitData.split_number,
    activityName: splitData.activity_name,
    activityDate: splitData.activity_start_date,
    activityDescription: splitData.activity_description,
    activityStravaId: splitData.activity_strava_id,
    pace: speedToPace(Number(splitData.average_speed)),
    distance: metersToMiles(Number(splitData.distance)),
    songs,
  };
}

export async function getSummaryStats(): Promise<SummaryStats> {
  // Return cached result if still valid
  if (statsCache && Date.now() - statsCache.timestamp < STATS_CACHE_TTL) {
    return statsCache.data;
  }

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

  const result = {
    totalActivities,
    totalPlays,
    totalDistinctSongsMatched,
  };

  // Cache the result
  statsCache = { data: result, timestamp: Date.now() };

  return result;
}

export async function getPaceBySong(): Promise<SongPaceData[]> {
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
