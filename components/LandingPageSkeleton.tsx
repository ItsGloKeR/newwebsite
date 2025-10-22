import React from 'react';

const SkeletonElement: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
);

const LandingPageSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans overflow-x-hidden">
            {/* Header */}
            <header className="container mx-auto max-w-screen-2xl p-4 flex justify-between items-center">
                <SkeletonElement className="h-6 w-28" />
                <div className="hidden md:flex items-center gap-8">
                    <SkeletonElement className="h-6 w-20" />
                    <SkeletonElement className="h-6 w-20" />
                    <SkeletonElement className="h-6 w-24" />
                </div>
                <SkeletonElement className="h-6 w-12 md:hidden" />
            </header>

            <main className="flex-grow flex flex-col justify-center">
                <section className="container mx-auto max-w-screen-2xl px-4 py-16 md:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <div>
                            <SkeletonElement className="h-12 w-3/4 mb-4" />
                            <SkeletonElement className="h-10 w-full mb-6" />
                            <SkeletonElement className="h-8 w-full" />
                            <SkeletonElement className="mt-10 h-12 w-full max-w-lg" />
                            <SkeletonElement className="mt-4 h-6 w-full max-w-lg" />
                            <SkeletonElement className="mt-10 h-12 w-48" />
                        </div>
                        <div className="relative h-64 md:h-80 lg:h-96 w-full">
                            <SkeletonElement className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] aspect-[2/3] z-20" />
                            <SkeletonElement className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 w-[35%] aspect-[2/3] z-10" />
                            <SkeletonElement className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 w-[35%] aspect-[2/3] z-10" />
                        </div>
                    </div>
                </section>

                <section className="container mx-auto max-w-screen-2xl px-4 my-24 md:my-32">
                    <div className="text-center mb-16">
                        <SkeletonElement className="h-10 w-1/2 mx-auto mb-4" />
                        <SkeletonElement className="h-6 w-3/4 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-gray-900/50 p-8 rounded-lg">
                                <SkeletonElement className="h-20 w-20 mx-auto mb-6 rounded-full" />
                                <SkeletonElement className="h-6 w-3/4 mx-auto mb-3" />
                                <SkeletonElement className="h-4 w-full mx-auto" />
                                <SkeletonElement className="h-4 w-1/2 mx-auto mt-2" />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPageSkeleton;