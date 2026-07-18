import React from 'react';

/** Skeleton loading placeholder. Renders animated placeholder blocks. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

/** Card skeleton for dashboard/standings */
export const CardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

/** Table row skeleton */
export const RowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-16" />
  </div>
);

/** Page loading skeleton */
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => <RowSkeleton key={i} />)}
    </div>
  </div>
);
