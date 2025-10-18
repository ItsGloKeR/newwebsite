import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-800 animate-pulse">
      <div className="aspect-[2/3] w-full"></div>
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
