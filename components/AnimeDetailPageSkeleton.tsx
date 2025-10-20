import React from 'react';

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

                <div className="relative container mx-auto max-w-screen-2xl p-4 md:p-8 flex items-center gap-8">
                    {/* Back Button Skeleton */}
                    <div className="absolute top-8 left-4 md:left-8 z-30">
                        <SkeletonElement className="h-10 w-24" />
                    </div>
                    {/* Cover Image Skeleton */}
                    <div className="flex-shrink-0 w-1/3 max-w-[250px] hidden md:block">
                        <SkeletonElement className="w-full aspect-[2/3]" />
                    </div>
                    {/* Details Block Skeleton */}
                    <div className="flex flex-col gap-4 w-full md:w-2/3">
                        <SkeletonElement className="h-12 w-3/4" />
                        <SkeletonElement className="h-6 w-1/2" />
                        <div className="flex flex-wrap gap-2">
                            <SkeletonElement className="h-6 w-20" />
                            <SkeletonElement className="h-6 w-24" />
                            <SkeletonElement className="h-6 w-16" />
                        </div>
                        <SkeletonElement className="h-5 w-1/3" />
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <SkeletonElement className="h-12 w-40" />
                            <SkeletonElement className="h-12 w-40" />
                            <SkeletonElement className="h-12 w-28" />
                            <SkeletonElement className="h-12 w-12 rounded-full" />
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
                    <SkeletonElement className="h-32 w-full" />
                </div>

                {/* Discover More Skeleton */}
                <div className="mt-12">
                    <SkeletonElement className="h-8 w-1/3 mb-4" />
                    <div className="flex gap-4 md:gap-6 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="w-32 md:w-40 flex-shrink-0">
                                <SkeletonElement className="aspect-[2/3]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPageSkeleton;