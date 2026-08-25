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
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight">Recent Plays</h1>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full glass-panel overflow-hidden">
          <thead>
            <tr className="border-b glass-border">
              <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                Track Name
              </th>
              <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                Artist
              </th>
              <th className="text-left py-3 px-4 font-bold text-spotify-green text-base leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                Played At
              </th>
            </tr>
          </thead>
          <tbody>
            {plays.map((play, idx) => (
              <tr
                key={play.id}
                className={`${
                  idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'
                } ${
                  idx < plays.length - 1 ? 'border-b glass-border' : ''
                } hover:bg-[rgba(255,255,255,0.08)] transition`}
              >
                <td className="py-3 px-4 text-white font-bold text-base">{play.track_name}</td>
                <td className="py-3 px-4 text-white opacity-75 font-light text-base">{play.artist}</td>
                <td className="py-3 px-4 text-white opacity-60 font-light text-base">
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
