'use client';

import { useState } from "react";
import Link from "next/link";

function isTruncated(text: string): boolean {
  return text.length > 120;
}

export default function RunRow({
  activity,
}: {
  activity: any;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncated = activity.description && isTruncated(activity.description);

  const handleShowMore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleShowLess = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <Link
      href={`/runs/${activity.strava_id}`}
      className="block"
    >
      <div className="relative rounded-lg glass-panel overflow-hidden hover:bg-[rgba(255,255,255,0.18)] transition group p-4">
        {/* Accent wash */}
        <div className="absolute inset-0 bg-linear-to-l from-spotify-green/10 to-transparent pointer-events-none" />

        <div className="relative">
          {/* Header row with name and key stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-spotify-green hover:underline font-bold text-lg leading-tight">
                {activity.name}
              </h3>
            </div>
            <div className="grid text-sm" style={{ gridTemplateColumns: 'repeat(4, minmax(75px, 1fr))', gap: '1rem' }}>
              <div>
                <p className="text-black text-sm uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
                  Distance
                </p>
                <p className="text-white font-bold text-base">
                  {activity.distance} mi
                </p>
              </div>
              <div>
                <p className="text-black text-sm uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
                  Pace
                </p>
                <p className="text-white font-mono font-bold text-base">
                  {activity.pace}
                </p>
              </div>
              <div>
                <p className="text-black text-sm uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
                  Time
                </p>
                <p className="text-white font-bold text-base">
                  {activity.time}
                </p>
              </div>
              <div>
                <p className="text-black text-sm uppercase tracking-wide mb-1 font-light" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
                  Date
                </p>
                <p className="text-white font-bold text-base">
                  {activity.start_date}
                </p>
              </div>
            </div>
          </div>

          {/* Description section with expand/collapse */}
          {activity.description && (
            <div className="pt-3 border-t border-dark/50">
              <p className={`text-white text-base leading-relaxed font-light ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {activity.description}
                {!isExpanded && truncated && (
                  <button
                    onClick={handleShowMore}
                    className="ml-1 text-spotify-green font-semibold hover:underline"
                  >
                    Show more
                  </button>
                )}
              </p>
              {isExpanded && truncated && (
                <button
                  onClick={handleShowLess}
                  className="mt-2 text-spotify-green text-sm font-semibold hover:underline"
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
