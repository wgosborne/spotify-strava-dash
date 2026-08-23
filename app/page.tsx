import Link from "next/link";
import Image from "next/image";
import { getTopSongsByPace, getOverallFastestSplit, getSummaryStats, getMostPlayedMatchedSongs } from "@/lib/insights";
import { PaceChart } from "./components/PaceChart";

export default async function Home() {
  const [topSongs, fastestSplit, stats, mostPlayed] = await Promise.all([
    getTopSongsByPace(5),
    getOverallFastestSplit(),
    getSummaryStats(),
    getMostPlayedMatchedSongs(5),
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

            <div className="flex gap-6 items-start">
              {/* Pace - the hero element */}
              <div className="shrink-0">
                <p className="text-5xl font-bold text-spotify-green">
                  {fastestSplit.pace}
                </p>
                <p className="text-white text-xs mt-1">
                  Split {fastestSplit.splitNumber}
                </p>
              </div>

              {/* Supporting details - all secondary info */}
              <div className="flex-1 min-w-0">
                {/* Activity name and date */}
                <p className="text-white text-sm font-semibold">
                  {fastestSplit.activityName}
                </p>
                <p className="text-white text-xs opacity-75 mb-3">
                  {fastestSplit.activityDate.toLocaleDateString()}
                </p>

                {/* Metadata row: distances + optional song - all inline */}
                <div className="flex items-center gap-3 text-white text-xs mb-4 flex-wrap">
                  <span>{fastestSplit.distance.toFixed(2)} mi split</span>
                  <span className="opacity-50">•</span>
                  <span>{fastestSplit.totalDistance.toFixed(2)} mi full run</span>

                  {fastestSplit.matchedSong && (
                    <>
                      <span className="opacity-50">•</span>
                      <div className="flex items-center gap-2">
                        {fastestSplit.matchedSong.albumArtUrl && (
                          <Image
                            src={fastestSplit.matchedSong.albumArtUrl}
                            alt={fastestSplit.matchedSong.trackName}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        )}
                        <span className="truncate">
                          {fastestSplit.matchedSong.trackName} - {fastestSplit.matchedSong.artist}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Description - at bottom with subtle separator */}
                {fastestSplit.activityDescription && (
                  <div className="pt-3 border-t border-gray-600/50">
                    <p className="text-white text-xs leading-relaxed">
                      {fastestSplit.activityDescription}
                    </p>
                  </div>
                )}
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
                {/* Row with 3-column layout */}
                <div className="flex gap-4 items-start min-h-24">
                  {/* Left column: Rank + Album art + Song info */}
                  <div className="flex gap-4 shrink-0 items-center">
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

                    {/* Song info - title, artist, metadata */}
                    <div className="min-w-0 flex flex-col">
                      <p className="text-white font-semibold text-sm">
                        {song.trackName}
                      </p>
                      <p className="text-white text-xs truncate">
                        {song.artist}
                      </p>
                      <p className="text-white text-xs mt-2 opacity-80">
                        {song.activityName} • {(song.splitDistanceMeters / 1609.34).toFixed(2)} mi split • {(song.totalActivityDistanceMeters / 1609.34).toFixed(2)} mi run
                      </p>
                    </div>
                  </div>

                  {/* Middle column: Description (fills flexible space, vertically centered) */}
                  <div className="flex-1 min-w-0 flex items-center py-2">
                    {song.activityDescription && (
                      <div className="flex flex-col border-l-2 border-white/15 pl-4">
                        <p className="text-white text-xs uppercase tracking-widest font-semibold opacity-50 mb-1">
                          Run Notes
                        </p>
                        <p className="text-white text-xs line-clamp-3">
                          {song.activityDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right column: Pace + Date */}
                  <div className="shrink-0 text-right">
                    <p className="text-spotify-green font-mono font-bold text-2xl">
                      {song.pace}
                    </p>
                    <p className="text-white text-xs mt-2">
                      {song.activityDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pace Chart */}
      {/* Most Played While Running */}
      {mostPlayed.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Most Played While Running
          </h2>
          <div className="glass-panel rounded-lg overflow-hidden">
            {mostPlayed.map((song, idx) => {
              const maxPlayCount = mostPlayed[0]?.playCount || 1;
              const barWidth = (song.playCount / maxPlayCount) * 100;

              return (
                <div
                  key={idx}
                  className="p-4"
                >
                  <div className="flex gap-4 items-center">
                    {/* Album art */}
                    <div className="shrink-0 relative w-10 h-10 rounded overflow-hidden bg-gray-800">
                      {song.albumArtUrl ? (
                        <Image
                          src={song.albumArtUrl}
                          alt={`${song.trackName} album art`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm2 1a1 1 0 100-2 1 1 0 000 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Track info and bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {song.trackName}
                      </p>
                      <p className="text-white text-xs truncate opacity-80">
                        {song.artist}
                      </p>

                      {/* Horizontal bar with play count */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-spotify-green rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p className="text-spotify-green font-bold text-sm shrink-0 w-8 text-right">
                          {song.playCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
