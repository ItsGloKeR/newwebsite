import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FilterState, MediaSeason, MediaFormat, MediaStatus, MediaSort } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  allGenres: string[];
  onReset: () => void;
}

const years = Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => String(new Date().getFullYear() - i));

const SORT_OPTIONS: { value: MediaSort; label: string }[] = [
    { value: MediaSort.POPULARITY_DESC, label: 'Popularity' },
    { value: MediaSort.TRENDING_DESC, label: 'Trending' },
    { value: MediaSort.SCORE_DESC, label: 'Score' },
    { value: MediaSort.FAVOURITES_DESC, label: 'Favorites' },
    { value: MediaSort.START_DATE_DESC, label: 'Newest' },
];

const Dropdown: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const summary = useMemo(() => {
        if (React.Children.count(children) > 0) {
            const selectedChildren = React.Children.toArray(children).filter(
                (child: any) => child.props.isSelected
            );
            if (selectedChildren.length > 2) return `${selectedChildren.length} Selected`;
            if (selectedChildren.length > 0) return selectedChildren.map((c: any) => c.props.label).join(', ');
        }
        return 'Any';
    }, [children]);

    return (
        <div className="relative w-full" ref={ref}>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center bg-gray-800 text-white rounded-lg p-2.5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <span className="truncate">{summary}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto p-2">
                    <div className="flex flex-wrap gap-2">{children}</div>
                </div>
            )}
        </div>
    );
};

const CheckboxOption: React.FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${isSelected ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
    >
        {label}
    </button>
);


const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange, allGenres, onReset }) => {
    
    const handleFieldChange = <T extends keyof FilterState>(field: T, value: FilterState[T]) => {
        onFiltersChange({ ...filters, [field]: value });
    };

    const handleMultiSelectToggle = (field: 'genres' | 'formats' | 'statuses', value: string) => {
        const currentValues = filters[field] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        handleFieldChange(field, newValues as any);
    };

    const removeFilter = (field: keyof FilterState, value?: any) => {
        if (field === 'search' || field === 'year' || field === 'season') {
            handleFieldChange(field, '' as any);
        } else if (field === 'scoreRange') {
            handleFieldChange('scoreRange', [0, 100]);
        } else if (value) {
            handleMultiSelectToggle(field as any, value);
        }
    };
    
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg mb-8 backdrop-blur-sm animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
                    <label htmlFor="search-bar" className="text-sm font-semibold text-gray-300 mb-2 block">Search</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                        <input
                            id="search-bar"
                            type="text"
                            value={filters.search}
                            onChange={e => handleFieldChange('search', e.target.value)}
                            placeholder="Search anime..."
                            className="bg-gray-800 text-white rounded-lg p-2.5 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {filters.search && <button onClick={() => handleFieldChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">&times;</button>}
                    </div>
                </div>
                {/* Other Filters */}
                <Dropdown label="Genres">
                    {allGenres.map(g => <CheckboxOption key={g} label={g} isSelected={filters.genres.includes(g)} onClick={() => handleMultiSelectToggle('genres', g)} />)}
                </Dropdown>
                <Dropdown label="Format">
                    {Object.values(MediaFormat).map(f => <CheckboxOption key={f} label={f.replace('_', ' ')} isSelected={filters.formats.includes(f)} onClick={() => handleMultiSelectToggle('formats', f)} />)}
                </Dropdown>
                <Dropdown label="Airing Status">
                     {Object.values(MediaStatus).map(s => <CheckboxOption key={s} label={s.replace('_', ' ')} isSelected={filters.statuses.includes(s)} onClick={() => handleMultiSelectToggle('statuses', s)} />)}
                </Dropdown>
                <div>
                     <label htmlFor="sort-by" className="text-sm font-semibold text-gray-300 mb-2 block">Sort By</label>
                     <select id="sort-by" value={filters.sort} onChange={e => handleFieldChange('sort', e.target.value as MediaSort)} className="bg-gray-800 text-white rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                     </select>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
                {filters.search && <div className="bg-cyan-900/50 text-cyan-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">Search: "{filters.search}" <button onClick={() => removeFilter('search')}>&times;</button></div>}
                {filters.genres.map(g => <div key={g} className="bg-cyan-900/50 text-cyan-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">{g} <button onClick={() => removeFilter('genres', g)}>&times;</button></div>)}
                {filters.formats.map(f => <div key={f} className="bg-cyan-900/50 text-cyan-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">{f.replace('_', ' ')} <button onClick={() => removeFilter('formats', f)}>&times;</button></div>)}
                {filters.statuses.map(s => <div key={s} className="bg-cyan-900/50 text-cyan-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">{s.replace('_', ' ')} <button onClick={() => removeFilter('statuses', s)}>&times;</button></div>)}
                <button onClick={onReset} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg> Reset</button>
            </div>
        </div>
    );
};

export default FilterBar;
