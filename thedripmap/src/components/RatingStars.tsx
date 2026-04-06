import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

export const RatingStars = ({ rating, count, size = 14, showCount = true }: RatingStarsProps) => {
  const safeRating = rating || 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.floor(safeRating) ? "text-amber-500 fill-amber-500" : "text-slate-200 fill-slate-200"}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-slate-700">{safeRating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-xs text-slate-400 font-medium">({count})</span>
      )}
    </div>
  );
};
