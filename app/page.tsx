import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Spotify Strava Dashboard
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Track your music and running data in one place
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/plays">
          <div className="border border-dark rounded-lg p-6 bg-dark hover:bg-dark/80 transition cursor-pointer">
            <h2 className="text-2xl font-bold text-spotify-green mb-2">Plays</h2>
            <p className="text-gray-400">
              Browse your recent Spotify plays
            </p>
          </div>
        </Link>

        <Link href="/runs">
          <div className="border border-dark rounded-lg p-6 bg-dark hover:bg-dark/80 transition cursor-pointer">
            <h2 className="text-2xl font-bold text-spotify-green mb-2">Runs</h2>
            <p className="text-gray-400">
              View your recent Strava activities
            </p>
          </div>
        </Link>

        <Link href="/insights">
          <div className="border border-dark rounded-lg p-6 bg-dark hover:bg-dark/80 transition cursor-pointer">
            <h2 className="text-2xl font-bold text-spotify-green mb-2">Insights</h2>
            <p className="text-gray-400">
              Find songs from your fastest splits
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
