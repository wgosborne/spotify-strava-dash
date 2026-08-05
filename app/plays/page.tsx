import { prisma } from "@/lib/prisma";

export default async function PlaysPage() {
  const plays = await prisma.plays.findMany({
    orderBy: {
      played_at: "desc",
    },
    take: 50,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">Recent Plays</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="border-b border-dark">
              <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                Track Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                Artist
              </th>
              <th className="text-left py-3 px-4 font-semibold text-spotify-green">
                Played At
              </th>
            </tr>
          </thead>
          <tbody>
            {plays.map((play, idx) => (
              <tr
                key={play.id}
                className={`border-b border-dark ${
                  idx % 2 === 0 ? "bg-dark" : "bg-black"
                } hover:bg-dark/80 transition`}
              >
                <td className="py-3 px-4 text-white">{play.track_name}</td>
                <td className="py-3 px-4 text-gray-400">{play.artist}</td>
                <td className="py-3 px-4 text-gray-500 text-xs md:text-sm">
                  {play.played_at.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plays.length === 0 && (
        <p className="mt-8 text-gray-500 text-center">No plays found.</p>
      )}
    </div>
  );
}
