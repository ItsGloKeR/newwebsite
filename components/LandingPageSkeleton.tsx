import React from 'react';

const SkeletonElement: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
);

const LandingPageSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-950 min-h-screen">
             <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.4), transparent 50%), radial-gradient(circle at bottom left, rgba(8, 145, 178, 0.4), transparent 50%)' }}></div>
            <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <header className="container mx-auto max-w-screen-2xl p-4 flex justify-between items-center">
                <SkeletonElement className="h-8 w-28" />
                <div className="hidden md:flex items-center gap-8">
                    <SkeletonElement className="h-6 w-20" />
                    <SkeletonElement className="h-6 w-20" />
                    <SkeletonElement className="h-6 w-24" />
                </div>
                <SkeletonElement className="h-8 w-8 rounded-full" />
            </header>
            
            <main className="flex-grow flex flex-col justify-center">
                <section className="container mx-auto max-w-screen-2xl px-4 py-16 md:py-24">
                    <div className="w-full text-center">
                        <SkeletonElement className="h-12 w-3/4 max-w-2xl mx-auto" />
                        <SkeletonElement className="h-10 w-1/2 max-w-lg mx-auto mt-4" />
                        <SkeletonElement className="h-6 w-full max-w-lg mx-auto mt-6" />
                        <SkeletonElement className="h-6 w-5/6 max-w-lg mx-auto mt-2" />
                        <SkeletonElement className="h-12 w-full max-w-lg mx-auto mt-10 rounded-full" />
                        <SkeletonElement className="h-12 w-48 mx-auto mt-10 rounded-lg" />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPageSkeleton;
