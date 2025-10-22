import React from 'react';
import SkeletonCard from './SkeletonCard';

const SkeletonElement: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
);

const AnimeDetailPageSkeleton: React.FC = () => {
    return (
        <div className="animate-fade-in text-white">
            {/* Banner Skeleton */}
            <div className="relative h-[65vh] md:h-[70vh] w-full bg-gray-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/50 to-transparent"></div>

                <div className="relative container mx-auto max-w-screen-2xl p-4 md:p-8 md:flex md:items-end md:gap-8">
                    <SkeletonElement className="absolute top-4 md:top-8 left-4 md:left-8 z-30 h-10 w-24 rounded-lg" />
                    
                    <div className="flex-shrink-0 w-1/3 max-w-[250px] hidden md:block self-center">
                        <SkeletonElement className="w-full aspect-[2/3] rounded-lg" />
                    </div>
                    
                    <div className="flex flex-col gap-3 md:gap-4 mt-16 md:mt-0 pt-8 md:pt-0 w-full md:w-auto text-center md:text-left">
                        <SkeletonElement className="h-10 lg:h-12 w-3/4 max-w-2xl mx-auto md:mx-0" />
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
                            <SkeletonElement className="h-5 w-20" />
                            <SkeletonElement className="h-5 w-24" />
                            <SkeletonElement className="h-5 w-16" />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <SkeletonElement className="h-6 w-20 rounded-full" />
                            <SkeletonElement className="h-6 w-24 rounded-full" />
                            <SkeletonElement className="h-6 w-16 rounded-full" />
                        </div>
                        <SkeletonElement className="h-5 w-1/3 mx-auto md:mx-0" />
                        <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                             <SkeletonElement className="h-7 w-24" />
                             <SkeletonElement className="h-7 w-24" />
                        </div>
                        {/* Action buttons skeleton */}
                        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mt-4">
                            <SkeletonElement className="h-12 w-40 rounded-md" />
                            <SkeletonElement className="h-12 w-32 rounded-md" />
                            <SkeletonElement className="h-12 w-32 rounded-md" />
                            <SkeletonElement className="h-12 w-12 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area Skeleton */}
            <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
                <div className="mt-8">
                    {/* Tabs Skeleton */}
                    <div className="flex border-b border-gray-700 mb-6">
                        <SkeletonElement className="h-10 w-24 mr-4" />
                        <SkeletonElement className="h-10 w-40 mr-4" />
                        <SkeletonElement className="h-10 w-20" />
                    </div>
                    {/* Tab Content Skeleton */}
                    <div className="space-y-2 p-6 bg-gray-900/50 rounded-lg">
                        <SkeletonElement className="h-5 w-full" />
                        <SkeletonElement className="h-5 w-full" />
                        <SkeletonElement className="h-5 w-5/6" />
                    </div>
                </div>

                {/* Discover More Skeleton */}
                <div className="mt-12">
                    <div className="flex justify-between items-center mb-4">
                      <SkeletonElement className="h-8 w-1/3" />
                      <SkeletonElement className="h-6 w-24" />
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-hidden">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <div key={index} className="w-40 flex-shrink-0">
                                <SkeletonCard />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPageSkeleton;
