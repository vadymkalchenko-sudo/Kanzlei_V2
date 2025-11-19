import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    id: number;
    aktenzeichen: string;
    mandant: string | null;
    gegner: string | null;
    status: string;
}

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const getApiBaseUrl = () => {
        const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
        return typeof envBaseUrl === "string" && envBaseUrl.length > 0
            ? envBaseUrl
            : "http://localhost:8000/api/";
    };

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setSearchLoading(true);
                try {
                    const API_BASE_URL = getApiBaseUrl();
                    const response = await axios.get(`${API_BASE_URL}akten/search/?q=${encodeURIComponent(searchQuery)}`);
                    setSearchResults(response.data);
                    setShowSearchResults(true);
                } catch (err) {
                    console.error("Fehler bei der Suche", err);
                    setSearchResults([]);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Close search results on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchResultClick = (akteId: number) => {
        navigate(`/akte/${akteId}`);
        setSearchQuery('');
        setShowSearchResults(false);
    };

    return (
        <div className="relative" ref={searchRef}>
            <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Search Results Dropdown */}
            {showSearchResults && (
                <div className="absolute top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
                    {searchLoading ? (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                            Suche läuft...
                        </div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((result) => (
                            <div
                                key={result.id}
                                onClick={() => handleSearchResultClick(result.id)}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-slate-800 text-sm">
                                        {result.aktenzeichen}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${result.status === 'Offen' ? 'bg-green-100 text-green-700' :
                                            result.status === 'Geschlossen' ? 'bg-gray-100 text-gray-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {result.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600">
                                    <div>Mandant: {result.mandant || 'N/A'}</div>
                                    {result.gegner && <div>Gegner: {result.gegner}</div>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                            Keine Ergebnisse gefunden
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
