import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Skeleton */}
        <div className="w-full md:w-1/3">
          <div className="w-full aspect-square bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-4">
          {/* Title Skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-1/4 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded-md animate-pulse" />
            ))}
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-muted rounded-md animate-pulse"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>

          {/* Categories Skeleton */}
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded-md w-1/6 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-20 bg-muted rounded-md animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Mechanics Skeleton */}
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded-md w-1/6 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-24 bg-muted rounded-md animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Credits Skeleton */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded-md w-1/6 animate-pulse" />
              <div className="h-4 bg-muted rounded-md w-2/3 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded-md w-1/6 animate-pulse" />
              <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
