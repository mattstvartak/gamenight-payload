import React from "react";

export const GameSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      {/* Skeleton for left column */}
      <div className="space-y-4">
        <div className="aspect-[2/3] w-full bg-muted rounded-lg animate-pulse"></div>

        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse"></div>
        </div>

        <div className="p-4 border rounded-lg space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        <div className="p-4 border rounded-lg space-y-4">
          <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="w-10 h-6 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
                    <div className="w-10 h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton for right column */}
      <div className="space-y-6">
        <div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2"></div>
              <div className="h-5 bg-muted rounded animate-pulse w-36"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-muted rounded animate-pulse w-20"
                ></div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={`h-4 bg-muted rounded animate-pulse w-${11 - (i % 5)}/12`}
              ></div>
            ))}
          </div>
        </div>

        <div>
          <div className="h-10 bg-muted rounded-md animate-pulse w-full mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-12 bg-muted rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
