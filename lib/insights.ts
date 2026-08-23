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
  totalActivityDistanceMeters: number;
  albumArtUrl: string | null;
}

interface SongWithAlbumArt extends Song {
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
  totalDistance: number;
  matchedSong: SongWithAlbumArt | null;
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

interface MostPlayedMatchedSong extends Song {
  albumArtUrl: string | null;
  playCount: number;
}

interface PaceOverTimeData {
  date: Date;
  pace: string;
  paceSeconds: number;
}

interface ArtistBreakdownData {
  artist: string;
  count: number;
}

interface RunFrequencyData {
  date: Date;
  count: number;
}

interface DistanceVsPaceData {
  distance: number;
  paceSeconds: number;
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
      total_distance: number;
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
        a.description as activity_description,
        a.distance as total_distance
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
        fs.total_distance,
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
      total_distance,
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
    totalActivityDistanceMeters: Number(item.total_distance),
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
      total_distance: number;
      start_offset_seconds: number;
      elapsed_time: number;
      track_name: string | null;
      artist: string | null;
      album_art_url: string | null;
    }>
  >`
    WITH fastest_split AS (
      SELECT
        s.split_number,
        a.strava_id as activity_strava_id,
        a.name as activity_name,
        a.start_date as activity_start_date,
        a.description as activity_description,
        a.distance as total_distance,
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
      fs.total_distance,
      fs.start_offset_seconds,
      fs.elapsed_time,
      p.track_name,
      p.artist,
      p.album_art_url
    FROM fastest_split fs
    LEFT JOIN LATERAL (
      SELECT track_name, artist, album_art_url
      FROM plays
      WHERE played_at >= fs.activity_start_date + (interval '1 second' * fs.start_offset_seconds)
        AND played_at < fs.activity_start_date + (interval '1 second' * (fs.start_offset_seconds + fs.elapsed_time))
      OFFSET 0
      LIMIT 1
    ) p ON true
  `;

  if (result.length === 0) {
    return null;
  }

  const splitData = result[0];
  const matchedSong = splitData.track_name
    ? {
        trackName: splitData.track_name,
        artist: splitData.artist!,
        albumArtUrl: splitData.album_art_url,
      }
    : null;

  return {
    splitNumber: splitData.split_number,
    activityName: splitData.activity_name,
    activityDate: splitData.activity_start_date,
    activityDescription: splitData.activity_description,
    activityStravaId: splitData.activity_strava_id,
    pace: speedToPace(Number(splitData.average_speed)),
    distance: metersToMiles(Number(splitData.distance)),
    totalDistance: metersToMiles(Number(splitData.total_distance)),
    matchedSong,
    songs: matchedSong ? [matchedSong] : [],
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

export async function getMostPlayedMatchedSongs(limit = 5): Promise<MostPlayedMatchedSong[]> {
  const results = await prisma.$queryRaw<
    Array<{
      track_name: string;
      artist: string;
      album_art_url: string | null;
      play_count: bigint;
    }>
  >`
    WITH matched_plays AS (
      SELECT
        p.track_name,
        p.artist,
        p.album_art_url,
        COUNT(*) as play_count
      FROM activities a
      JOIN splits s ON s.activity_id = a.strava_id
      JOIN plays p ON
        p.played_at >= a.start_date + (interval '1 second' * s.start_offset_seconds)
        AND p.played_at < a.start_date + (interval '1 second' * (s.start_offset_seconds + s.elapsed_time))
      WHERE
        s.distance >= 400
        AND s.average_speed <= 5.03
      GROUP BY p.track_name, p.artist, p.album_art_url
    )
    SELECT
      track_name,
      artist,
      album_art_url,
      play_count
    FROM matched_plays
    ORDER BY play_count DESC
    LIMIT ${limit}
  `;

  return results.map((item) => ({
    trackName: item.track_name,
    artist: item.artist,
    albumArtUrl: item.album_art_url,
    playCount: Number(item.play_count),
  }));
}

export async function getPaceOverTime(): Promise<PaceOverTimeData[]> {
  const results = await prisma.$queryRaw<
    Array<{
      activity_start_date: Date;
      fastest_average_speed: number;
    }>
  >`
    WITH fastest_per_activity AS (
      SELECT
        a.start_date as activity_start_date,
        s.average_speed,
        ROW_NUMBER() OVER (PARTITION BY a.strava_id ORDER BY s.average_speed DESC) as rn
      FROM activities a
      JOIN splits s ON s.activity_id = a.strava_id
      WHERE s.distance >= 400 AND s.average_speed <= 5.03
        AND a.start_date >= NOW() - INTERVAL '1 year'
    )
    SELECT
      activity_start_date,
      average_speed as fastest_average_speed
    FROM fastest_per_activity
    WHERE rn = 1
    ORDER BY activity_start_date ASC
  `;

  return results.map((item) => {
    const metersPerSecond = Number(item.fastest_average_speed);
    const paceInSecondsPerMile = 1609.34 / metersPerSecond;
    return {
      date: item.activity_start_date,
      pace: speedToPace(metersPerSecond),
      paceSeconds: paceInSecondsPerMile,
    };
  });
}

export async function getArtistBreakdown(limit = 10): Promise<ArtistBreakdownData[]> {
  const results = await prisma.$queryRaw<
    Array<{
      artist: string;
      run_count: bigint;
    }>
  >`
    WITH matched_songs AS (
      SELECT
        p.artist,
        a.strava_id
      FROM activities a
      JOIN splits s ON s.activity_id = a.strava_id
      CROSS JOIN LATERAL (
        SELECT DISTINCT artist
        FROM plays
        WHERE played_at >= a.start_date + (interval '1 second' * s.start_offset_seconds)
          AND played_at < a.start_date + (interval '1 second' * (s.start_offset_seconds + s.elapsed_time))
        OFFSET 0
      ) p
      WHERE s.distance >= 400 AND s.average_speed <= 5.03
        AND a.start_date >= NOW() - INTERVAL '1 year'
    )
    SELECT
      artist,
      COUNT(DISTINCT strava_id) as run_count
    FROM matched_songs
    GROUP BY artist
    ORDER BY run_count DESC
    LIMIT ${limit}
  `;

  return results.map((item) => ({
    artist: item.artist,
    count: Number(item.run_count),
  }));
}

export async function getRunFrequency(): Promise<RunFrequencyData[]> {
  const results = await prisma.$queryRaw<
    Array<{
      run_date: string;
      run_count: bigint;
    }>
  >`
    SELECT
      DATE(a.start_date AT TIME ZONE 'UTC') as run_date,
      COUNT(*) as run_count
    FROM activities a
    WHERE a.start_date >= NOW() - INTERVAL '1 year'
    GROUP BY DATE(a.start_date AT TIME ZONE 'UTC')
    ORDER BY run_date ASC
  `;

  return results.map((item) => ({
    date: new Date(item.run_date),
    count: Number(item.run_count),
  }));
}

export async function getDistanceVsPace(): Promise<DistanceVsPaceData[]> {
  const results = await prisma.$queryRaw<
    Array<{
      distance: number;
      average_speed: number;
    }>
  >`
    SELECT
      s.distance,
      s.average_speed
    FROM splits s
    JOIN activities a ON s.activity_id = a.strava_id
    WHERE s.distance >= 400 AND s.average_speed <= 5.03
      AND a.start_date >= NOW() - INTERVAL '1 year'
    ORDER BY s.distance ASC
  `;

  return results.map((item) => {
    const metersPerSecond = Number(item.average_speed);
    const paceInSecondsPerMile = 1609.34 / metersPerSecond;
    const distanceInMiles = metersToMiles(Number(item.distance));
    return {
      distance: distanceInMiles,
      paceSeconds: paceInSecondsPerMile,
    };
  });
}
