import React, { useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const generatePages = () => {
        const pages: (number | string)[] = [];
        const maxPagesVisible = isMobile ? 5 : 7;

        if (totalPages <= maxPagesVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        if (currentPage <= maxPagesVisible - 2) {
            for (let i = 1; i < maxPagesVisible - 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage > totalPages - (maxPagesVisible - 2)) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - (maxPagesVisible - 3); i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            const middlePageCount = maxPagesVisible - 4;
            const startPage = currentPage - Math.floor(middlePageCount / 2);
            for (let i = 0; i < middlePageCount + 1; i++) pages.push(startPage + i);
            pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };
    
    const pageNumbers = generatePages();

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            {pageNumbers.map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 rounded-md font-semibold transition-colors text-sm ${
                            currentPage === page
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="w-10 h-10 flex items-center justify-center text-gray-500 text-sm">
                        {page}
                    </span>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};

export default Pagination;