import React from 'react';
import SkeletonCard from './SkeletonCard';

const SkeletonTitle: React.FC = () => (
  <div className="h-10 w-72 bg-gray-800 rounded-md mb-6 animate-pulse"></div>
);

const VerticalSkeletonItem: React.FC = () => (
  <li className="flex items-center gap-4 p-2">
    <div className="w-16 h-24 bg-gray-800 rounded-md flex-shrink-0 animate-pulse"></div>
    <div className="overflow-hidden flex-grow space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
      <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
    </div>
  </li>
);

const CarouselSkeletonCard: React.FC = () => (
    <div className="relative overflow-hidden rounded-lg bg-gray-800 animate-pulse w-full">
        <div className="aspect-[2/3] w-full"></div>
    </div>
);

const HomePageSkeleton: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Skeleton */}
      <div className="h-[60vh] md:h-[80vh] w-full bg-gray-900 animate-pulse"></div>
      
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Carousel Skeleton */}
            <section className="mb-12">
              <SkeletonTitle />
              <div className="flex gap-4 md:gap-6 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="w-56 flex-shrink-0">
                    <CarouselSkeletonCard />
                  </div>
                ))}
              </div>
            </section>

            {/* Grid Skeleton */}
            <section className="mb-12">
              <SkeletonTitle />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)}
              </div>
            </section>
          </div>

          {/* Vertical List Skeleton */}
          <div className="lg:col-span-1">
            <section className="mb-12">
              <SkeletonTitle />
              <ul className="flex flex-col gap-4">
                {Array.from({ length: 10 }).map((_, index) => <VerticalSkeletonItem key={index} />)}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageSkeleton;