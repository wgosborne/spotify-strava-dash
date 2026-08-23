import Link from "next/link";
import Image from "next/image";
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
        <div className="glass-panel rounded-lg p-6">
          <p className="text-white text-sm uppercase tracking-wide mb-2">
            Total Runs
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalActivities}
          </p>
        </div>
        <div className="glass-panel rounded-lg p-6">
          <p className="text-white text-sm uppercase tracking-wide mb-2">
            Total Plays
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalPlays}
          </p>
        </div>
        <div className="glass-panel rounded-lg p-6">
          <p className="text-white text-sm uppercase tracking-wide mb-2">
            Songs Matched
          </p>
          <p className="text-3xl font-bold text-spotify-green">
            {stats.totalDistinctSongsMatched}
          </p>
        </div>
      </div>

      {/* Overall Fastest Split */}
      {fastestSplit && (
        <div className="glass-panel rounded-lg mb-10 overflow-hidden hover:glass-panel transition relative">
          {/* Accent wash */}
          <div className="absolute inset-0 bg-linear-to-l from-spotify-green/10 to-transparent pointer-events-none" />

          <div className="relative p-6">
            <p className="text-spotify-green text-xs uppercase tracking-widest font-semibold mb-4">
              ⚡ Overall Fastest Split
            </p>

            <div className="flex gap-6 items-start mb-6">
              {/* Pace display */}
              <div className="shrink-0">
                <p className="text-5xl font-bold text-spotify-green">
                  {fastestSplit.pace}
                </p>
                <p className="text-white text-xs mt-1">
                  Split {fastestSplit.splitNumber}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {fastestSplit.songs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-white font-semibold text-sm truncate">
                      {fastestSplit.songs[0].trackName}
                    </p>
                    <p className="text-white text-sm truncate">
                      {fastestSplit.songs[0].artist}
                    </p>
                    {fastestSplit.songs.length > 1 && (
                      <p className="text-white text-xs mt-2">
                        +{fastestSplit.songs.length - 1} more song{fastestSplit.songs.length > 2 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-dark/50">
                  <p className="text-white text-sm mb-2">
                    {fastestSplit.distance.toFixed(2)} mi • {fastestSplit.activityName}
                  </p>
                  <p className="text-white text-xs">
                    {fastestSplit.activityDate.toLocaleDateString()}
                  </p>
                  {fastestSplit.activityDescription && (
                    <p className="text-white text-xs mt-2">
                      {fastestSplit.activityDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Songs By Pace */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          Top 5 Songs I&apos;ve Run Fastest To
        </h2>
        <div className="glass-panel rounded-lg overflow-hidden">
          {topSongs.map((song, idx) => (
            <div
              key={idx}
              className={`relative p-4 ${idx < topSongs.length - 1 ? 'border-b glass-border' : ''}`}
            >
              {/* Accent wash on the right */}
              <div className="absolute inset-0 bg-linear-to-l from-spotify-green/10 to-transparent pointer-events-none" />

              <div className="relative">
                {/* Top section with rank, album art, song info, and pace */}
                <div className="flex gap-4 items-start mb-4">
                  {/* Rank circle */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-spotify-green/20 flex items-center justify-center border border-spotify-green/30">
                    <span className="text-spotify-green font-bold text-sm">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Album art thumbnail */}
                  <div className="shrink-0 relative w-16 h-16 rounded overflow-hidden bg-gray-800">
                    {song.albumArtUrl ? (
                      <Image
                        src={song.albumArtUrl}
                        alt={`${song.trackName} album art`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm2 1a1 1 0 100-2 1 1 0 000 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text content - left side */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">
                      {song.trackName}
                    </p>
                    <p className="text-white text-xs truncate">
                      {song.artist}
                    </p>
                    <p className="text-white text-xs mt-2">
                      {song.activityName} • {(song.splitDistanceMeters / 1609.34).toFixed(2)} mi
                    </p>
                  </div>

                  {/* Pace display - right side */}
                  <div className="shrink-0 text-right">
                    <p className="text-spotify-green font-mono font-bold text-2xl">
                      {song.pace}
                    </p>
                    <p className="text-white text-xs mt-2">
                      {song.activityDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Description section if available */}
                {song.activityDescription && (
                  <div className="pt-4 border-t glass-border">
                    <p className="text-white text-sm leading-relaxed">
                      {song.activityDescription}
                    </p>
                  </div>
                )}
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
          <div className="glass-panel rounded-lg p-4 overflow-x-auto">
            <PaceChart data={paceBySong} />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10 border-t glass-border">
        <Link href="/plays">
          <div className="glass-panel rounded-lg p-4 hover:bg-[rgba(255,255,255,0.08)] transition cursor-pointer">
            <h3 className="text-lg font-semibold text-spotify-green mb-1">
              Plays
            </h3>
            <p className="text-white text-sm">
              Browse recent Spotify plays
            </p>
          </div>
        </Link>
        <Link href="/runs">
          <div className="glass-panel rounded-lg p-4 hover:bg-[rgba(255,255,255,0.08)] transition cursor-pointer">
            <h3 className="text-lg font-semibold text-spotify-green mb-1">
              Runs
            </h3>
            <p className="text-white text-sm">
              View recent Strava activities
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
