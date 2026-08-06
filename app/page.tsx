import Link from "next/link";
import { getTopSongsByPace, getOverallFastestSplit, getSummaryStats, getPaceBySong } from "@/lib/insights";
import { PaceChart } from "./components/PaceChart";

export default async function Home() {
  const [topSongs, fastestSplit, stats, paceBySong] = await Promise.all([
    getTopSongsByPace(5),
    getOverallFastestSplit(),
    getSummaryStats(),
    getPaceBySong(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-10">
        Dashboard
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="border border-dark rounded-lg p-6 bg-dark">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">
            Total Runs
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalActivities}
          </p>
        </div>
        <div className="border border-dark rounded-lg p-6 bg-dark">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">
            Total Plays
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalPlays}
          </p>
        </div>
        <div className="border border-dark rounded-lg p-6 bg-dark">
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">
            Songs Matched
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalDistinctSongsMatched}
          </p>
        </div>
      </div>

      {/* Overall Fastest Split */}
      {fastestSplit && (
        <div className="border-2 border-spotify-green rounded-lg p-6 bg-dark mb-10">
          <div className="mb-4">
            <p className="text-spotify-green text-sm uppercase tracking-wide font-semibold mb-2">
              Overall Fastest Split
            </p>
            {fastestSplit.songs.length > 0 && (
              <p className="text-gray-300 text-sm">
                <span className="text-white font-medium">{fastestSplit.songs[0].trackName}</span>
                <span className="text-gray-600"> by </span>
                <span className="text-gray-400">{fastestSplit.songs[0].artist}</span>
              </p>
            )}
          </div>
          <div className="mb-6">
            <p className="text-4xl font-bold text-white mb-4">
              {fastestSplit.pace}
            </p>
            {fastestSplit.songs.length > 0 && (
              <div className="mb-4 pb-4 border-b border-dark/50">
                {fastestSplit.songs.map((song, idx) => (
                  <p key={idx} className="text-gray-300 text-sm">
                    <span className="text-white font-medium">{song.trackName}</span>
                    <span className="text-gray-600"> by </span>
                    <span className="text-gray-400">{song.artist}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="text-gray-400 text-sm mb-3">
              {fastestSplit.distance.toFixed(2)} mi • Split {fastestSplit.splitNumber}
            </p>
            <Link
              href={`/runs/${fastestSplit.activityStravaId}`}
              className="text-spotify-green hover:underline text-sm"
            >
              {fastestSplit.activityName}
            </Link>
            <p className="text-gray-500 text-xs mt-1">
              {fastestSplit.activityDate.toLocaleDateString()}
            </p>
            {fastestSplit.activityDescription && (
              <p className="text-gray-400 text-xs mt-2">
                {fastestSplit.activityDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Top Songs By Pace */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          Top 5 Songs I&apos;ve Run Fastest To
        </h2>
        <div className="space-y-3">
          {topSongs.map((song, idx) => (
            <div key={idx} className="border border-dark rounded-lg p-4 bg-dark hover:bg-dark/80 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {song.trackName}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {song.artist}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    {song.activityName}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {song.activityDate.toLocaleDateString()}
                  </p>
                  {song.activityDescription && (
                    <p className="text-gray-600 text-xs mt-1">
                      {song.activityDescription}
                    </p>
                  )}
                </div>
                <p className="text-spotify-green font-mono font-semibold whitespace-nowrap">
                  {song.pace}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pace Chart */}
      {paceBySong.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Pace by Song (Top 15)
          </h2>
          <div className="border border-dark rounded-lg bg-dark p-4 overflow-x-auto">
            <PaceChart data={paceBySong} />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10 border-t border-dark">
        <Link href="/plays">
          <div className="border border-dark rounded-lg p-4 bg-dark hover:bg-dark/80 transition cursor-pointer">
            <h3 className="text-lg font-semibold text-spotify-green mb-1">
              Plays
            </h3>
            <p className="text-gray-400 text-sm">
              Browse recent Spotify plays
            </p>
          </div>
        </Link>
        <Link href="/runs">
          <div className="border border-dark rounded-lg p-4 bg-dark hover:bg-dark/80 transition cursor-pointer">
            <h3 className="text-lg font-semibold text-spotify-green mb-1">
              Runs
            </h3>
            <p className="text-gray-400 text-sm">
              View recent Strava activities
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
