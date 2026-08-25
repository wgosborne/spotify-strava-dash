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
          {/* Header row with title and pace (hero stat) */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-white hover:underline font-bold text-lg leading-tight mb-3">
                {activity.name}
              </h3>
              {/* Secondary stats: distance, time, date */}
              <div className="flex flex-wrap gap-4 text-white text-sm font-light">
                <span>{activity.distance} mi</span>
                <span className="opacity-50">•</span>
                <span>{activity.time}</span>
                <span className="opacity-50">•</span>
                <span>{activity.start_date}</span>
              </div>
            </div>
            {/* Pace - the hero element */}
            <div className="shrink-0 text-right sm:text-left">
              <p className="text-spotify-green font-mono font-bold text-3xl leading-tight">
                {activity.pace}
              </p>
            </div>
          </div>

          {/* Description section with expand/collapse */}
          {activity.description && (
            <div className="pt-3">
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
