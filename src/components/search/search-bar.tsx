'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState } from 'react';

export function SearchBar() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useDebouncedCallback((term: string) => {
        setIsSearching(true);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`/search?${params.toString()}`);
        setIsSearching(false);
    }, 300);

    return (
        <div className="relative w-full max-w-xl mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-primary-500"
                    placeholder="Search people or posts..."
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q')?.toString()}
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
