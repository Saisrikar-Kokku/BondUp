'use client';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Mobile navbar skeleton */}
            <nav className="md:hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-40 px-4 h-14 flex items-center justify-between">
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
            </nav>

            <div className="flex h-[calc(100vh-56px)] md:h-screen">
                {/* Conversation list skeleton (desktop) */}
                <div className="hidden md:flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat area skeleton */}
                <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                    {/* Chat header skeleton */}
                    <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Messages area skeleton */}
                    <div className="flex-1 p-4 space-y-4">
                        {/* Received message skeleton */}
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            <div className="h-16 w-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                        {/* Sent message skeleton */}
                        <div className="flex justify-end">
                            <div className="h-12 w-40 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                        {/* Received message skeleton */}
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            <div className="h-20 w-56 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                    </div>

                    {/* Input area skeleton */}
                    <div className="h-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex items-center gap-3 animate-pulse">
                        <div className="flex-1 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}
