import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    
    const generatePages = () => {
        const pages = [];
        const pageNeighbours = 1; // How many pages to show around current page
        const totalNumbers = (pageNeighbours * 2) + 3; // e.g. 1 ... 4 5 6 ... 10
        const totalBlocks = totalNumbers + 2;

        if (totalPages > totalBlocks) {
            const startPage = Math.max(2, currentPage - pageNeighbours);
            const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
            let pagesToShow = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

            const hasLeftSpill = startPage > 2;
            const hasRightSpill = (totalPages - endPage) > 1;
            const spillOffset = totalNumbers - (pagesToShow.length + 1);

            switch (true) {
                case (hasLeftSpill && !hasRightSpill): {
                    const extraPages = Array.from({ length: spillOffset + 1 }, (_, i) => startPage - 1 - i).reverse();
                    pagesToShow = [...extraPages, ...pagesToShow];
                    break;
                }
                case (!hasLeftSpill && hasRightSpill): {
                    const extraPages = Array.from({ length: spillOffset }, (_, i) => endPage + 1 + i);
                    pagesToShow = [...pagesToShow, ...extraPages];
                    break;
                }
            }
            
            pages.push(1);
            if (hasLeftSpill) pages.push('...');
            pages.push(...pagesToShow);
            if (hasRightSpill) pages.push('...');
            pages.push(totalPages);
        } else {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        }
        return pages;
    };
    
    const pageNumbers = generatePages();

    return (
        <div className="flex justify-center items-center gap-2 mt-8">
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
                        className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                            currentPage === page
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="px-4 py-2 text-gray-500">
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
