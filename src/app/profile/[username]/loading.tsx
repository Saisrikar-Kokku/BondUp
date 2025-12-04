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
                {/* Profile header skeleton */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start animate-pulse">
                        {/* Avatar skeleton */}
                        <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />

                        {/* Info skeleton */}
                        <div className="flex-1 text-center sm:text-left space-y-4">
                            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                                <div className="space-y-2">
                                    <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-700" />
                            </div>

                            <div className="h-16 w-full rounded bg-gray-200 dark:bg-gray-700" />

                            {/* Stats skeleton */}
                            <div className="flex justify-center gap-6 sm:justify-start">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="text-center space-y-1">
                                        <div className="h-6 w-8 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts section skeleton */}
                <div className="space-y-6">
                    <div className="h-7 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    {Array.from({ length: 2 }).map((_, i) => (
                        <PostCardSkeleton key={i} />
                    ))}
                </div>
            </main>
        </div>
    );
}
