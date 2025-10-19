import React, { useState, useEffect, useRef } from 'react';
import { FilterState, MediaSeason, MediaFormat, MediaStatus, MediaSort } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGenres: string[];
  onApply: (selectedFilters: FilterState) => void;
  currentFilters: FilterState;
  initialFilters: FilterState;
}

const SORT_OPTIONS: { value: MediaSort; label: string }[] = [
    { value: MediaSort.POPULARITY_DESC, label: 'Popularity' },
    { value: MediaSort.TRENDING_DESC, label: 'Trending' },
    { value: MediaSort.SCORE_DESC, label: 'Score' },
    { value: MediaSort.FAVOURITES_DESC, label: 'Favorites' },
    { value: MediaSort.START_DATE_DESC, label: 'Start Date' },
];

const OptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
}> = ({ label, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 border-2 ${
            isSelected
            ? 'bg-cyan-500 border-cyan-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, allGenres, onApply, currentFilters, initialFilters }) => {
    const [filters, setFilters] = useState<FilterState>(currentFilters);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleMultiSelectToggle = (field: 'genres' | 'formats' | 'statuses', value: string) => {
        setFilters(prev => {
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };
    
    const handleSeasonSelect = (season?: MediaSeason) => {
        setFilters(prev => ({
            ...prev,
            season: prev.season === season ? undefined : season
        }));
    };

    const handleApply = () => {
        onApply(filters);
    };

    const handleClear = () => {
        setFilters(initialFilters);
        onApply(initialFilters);
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="mb-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-3 border-l-4 border-cyan-400 pl-3">{title}</h3>
            {children}
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
            <div ref={modalRef} className="bg-gray-900 text-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 id="filter-modal-title" className="text-2xl font-bold">Filters & Sort</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close filters">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                        {renderSection("Sort By", (
                             <select
                                value={filters.sort}
                                onChange={e => setFilters(f => ({ ...f, sort: e.target.value as MediaSort }))}
                                className="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        ))}

                        {renderSection("Year", (
                             <input
                                type="number"
                                placeholder={`e.g. ${new Date().getFullYear()}`}
                                value={filters.year}
                                onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                                className="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        ))}

                        {renderSection("Season", (
                            <div className="flex flex-wrap gap-3">
                                {Object.values(MediaSeason).map(s => <OptionButton key={s} label={s} isSelected={filters.season === s} onClick={() => handleSeasonSelect(s)} />)}
                            </div>
                        ))}

                         {renderSection("Format", (
                            <div className="flex flex-wrap gap-3">
                                {Object.values(MediaFormat).map(f => <OptionButton key={f} label={f.replace('_', ' ')} isSelected={filters.formats.includes(f)} onClick={() => handleMultiSelectToggle('formats', f)} />)}
                            </div>
                        ))}

                        {renderSection("Status", (
                           <div className="flex flex-wrap gap-3">
                                {Object.values(MediaStatus).map(s => <OptionButton key={s} label={s.replace('_', ' ')} isSelected={filters.statuses.includes(s)} onClick={() => handleMultiSelectToggle('statuses', s)} />)}
                            </div>
                        ))}
                    </div>
                    <div>
                        {renderSection("Genres", (
                            <div className="max-h-96 overflow-y-auto bg-black/20 p-3 rounded-md">
                                <div className="flex flex-wrap gap-3">
                                    {allGenres.map(genre => <OptionButton key={genre} label={genre} isSelected={filters.genres.includes(genre)} onClick={() => handleMultiSelectToggle('genres', genre)} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end gap-4">
                    <button onClick={handleClear} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-md transition-colors">
                        Reset
                    </button>
                    <button onClick={handleApply} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-md transition-colors">
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;