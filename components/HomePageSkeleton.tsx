import React from 'react';
import SkeletonCard from './SkeletonCard';

const SkeletonTitle: React.FC<{ className?: string }> = ({ className = 'w-72' }) => (
  <div className={`h-8 bg-gray-800 rounded-md mb-6 animate-pulse ${className}`}></div>
);

const VerticalSkeletonItem: React.FC = () => (
  <li className="flex items-center gap-4 p-2 bg-gray-800/50 rounded-lg">
    <div className="w-16 h-24 bg-gray-700 rounded-md flex-shrink-0 animate-pulse"></div>
    <div className="overflow-hidden flex-grow space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
    </div>
  </li>
);

const CarouselSkeleton: React.FC<{ cardCount?: number; size?: 'normal' | 'small' }> = ({ cardCount = 6, size = 'normal' }) => (
    <div className="flex gap-4 md:gap-6 overflow-hidden">
        {Array.from({ length: cardCount }).map((_, index) => (
            <div key={index} className={`${size === 'small' ? 'w-40' : 'w-48'} flex-shrink-0`}>
                <SkeletonCard />
            </div>
        ))}
    </div>
);

const HomePageSkeleton: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Skeleton */}
      <div className="h-[60vh] md:h-[70vh] w-full bg-gray-900 animate-pulse -mt-16 pt-16"></div>
      
      <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
        {/* Continue Watching / Trending Skeleton */}
        <section className="mb-12">
            <SkeletonTitle />
            <CarouselSkeleton />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 flex flex-col gap-12">
                {/* Latest Episodes Carousel Skeleton */}
                <section>
                    <SkeletonTitle className="w-64" />
                    <CarouselSkeleton size="small" cardCount={7} />
                </section>

                {/* All Time Popular Carousel Skeleton */}
                <section>
                    <SkeletonTitle />
                    <CarouselSkeleton />
                </section>

                {/* Two small carousels Skeleton */}
                 <section>
                    <SkeletonTitle className="w-64" />
                    <CarouselSkeleton size="small" cardCount={7}/>
                </section>
            </div>

            {/* Vertical Lists Skeleton */}
            <div className="lg:col-span-1">
                <div className="flex flex-col gap-8">
                    <section>
                        <SkeletonTitle className="w-48" />
                        <ul className="flex flex-col gap-2 p-2 bg-gray-900/50 rounded-lg">
                            {Array.from({ length: 5 }).map((_, index) => <VerticalSkeletonItem key={index} />)}
                        </ul>
                    </section>
                    <section>
                        <SkeletonTitle className="w-48" />
                        <ul className="flex flex-col gap-2 p-2 bg-gray-900/50 rounded-lg">
                            {Array.from({ length: 5 }).map((_, index) => <VerticalSkeletonItem key={index} />)}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
        
        {/* Airing Schedule Skeleton */}
        <section className="mt-16">
            <SkeletonTitle className="w-64" />
            <div className="bg-gray-900/50 rounded-lg p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-b-0">
                        <div className="h-6 w-16 bg-gray-800 rounded animate-pulse"></div>
                        <div className="w-10 h-14 bg-gray-800 rounded-md animate-pulse"></div>
                        <div className="flex-grow space-y-2">
                             <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                             <div className="h-3 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </div>
    </div>
  );
};

export default HomePageSkeleton;