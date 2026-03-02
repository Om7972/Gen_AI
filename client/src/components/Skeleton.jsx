import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="glass-card rounded-3xl p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-2xl skeleton"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 skeleton rounded-lg w-3/4"></div>
          <div className="h-3 skeleton rounded-lg w-full"></div>
          <div className="h-3 skeleton rounded-lg w-5/6"></div>
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        <div className="h-8 skeleton rounded-lg w-20"></div>
        <div className="h-8 skeleton rounded-lg w-20"></div>
      </div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 skeleton rounded-lg"
          style={{ width: `${100 - (i * 10)}%` }}
        ></div>
      ))}
    </div>
  );
};

export const SkeletonSummary = () => {
  return (
    <div className="glass-card rounded-3xl p-8 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl skeleton"></div>
        <div className="h-6 skeleton rounded-lg w-48"></div>
      </div>
      <SkeletonText lines={5} />
      <div className="mt-6 flex flex-wrap gap-2">
        <div className="h-8 skeleton rounded-full w-24"></div>
        <div className="h-8 skeleton rounded-full w-32"></div>
        <div className="h-8 skeleton rounded-full w-20"></div>
      </div>
    </div>
  );
};
