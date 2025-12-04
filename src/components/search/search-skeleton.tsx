'use client';

/**
 * Skeleton loader for user card in search results
 */
export function UserCardSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Button skeleton */}
            <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
    );
}

/**
 * Skeleton loader for post card in search results
 */
export function PostCardSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-pulse">
            {/* Header with avatar and name */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Actions skeleton */}
            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    );
}

/**
 * Search results skeleton - shows multiple skeleton cards
 */
export function SearchResultsSkeleton({ type = 'people' }: { type?: 'people' | 'posts' }) {
    const count = type === 'people' ? 5 : 3;

    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                type === 'people'
                    ? <UserCardSkeleton key={i} />
                    : <PostCardSkeleton key={i} />
            ))}
        </div>
    );
}
