'use client';

import { PostCardSkeleton } from '@/components/search/search-skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Navbar skeleton */}
            <nav className="hidden md:block border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="flex gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile navbar skeleton */}
            <nav className="md:hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-40 px-4 h-14 flex items-center justify-between">
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header skeleton */}
                <div className="mb-8">
                    <div className="h-9 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                    <div className="h-5 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>

                {/* Posts skeleton */}
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <PostCardSkeleton key={i} />
                    ))}
                </div>
            </main>
        </div>
    );
}
