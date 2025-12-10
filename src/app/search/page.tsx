import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/search/search-bar';
import { SearchTabs } from '@/components/search/search-tabs';
import { searchUsers, searchPosts } from '@/lib/actions/search';
import { UserCard } from '@/components/profile/user-card';
import { PostFeed } from '@/components/posts/post-feed';

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        type?: string;
    }>;
}

import { getFollowingIds } from '@/lib/actions/follows';

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q: query, type = 'people' } = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile and following IDs in parallel for faster loading
    const [profileResult, followingIds] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getFollowingIds(user.id),
    ]);

    const profile = profileResult.data;

    let results = [];
    const hasSearched = !!query;

    if (query) {
        if (type === 'people') {
            const { data } = await searchUsers(query);
            results = data || [];
        } else {
            const { data } = await searchPosts(query);
            results = data || [];
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0 overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
                <div className="absolute top-1/3 -right-32 w-72 h-72 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-primary-400/15 to-violet-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            <Navbar user={profile || { id: user.id, username: 'user' }} />

            <main className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500 bg-clip-text text-transparent">
                            Search
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Find people, posts, and everything on BondUp
                    </p>
                </div>

                {/* Premium Search Box */}
                <div className="mb-8 relative">
                    {/* Gradient border glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500 rounded-3xl opacity-20 blur-sm" />
                    <div className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-xl">
                        <SearchBar />
                        <div className="mt-4">
                            <SearchTabs />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {!hasSearched ? (
                        <div className="relative rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-primary-500/5 to-purple-500/5" />
                            <div className="relative p-12 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4">
                                    <span className="text-4xl">🔍</span>
                                </div>
                                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
                                    What are you looking for?
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                                    Search for people to connect with or discover interesting posts
                                </p>
                            </div>
                        </div>
                    ) : results.length > 0 ? (
                        type === 'people' ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {results.map((resultUser: any, index: number) => (
                                    <div
                                        key={resultUser.id}
                                        className="animate-fadeIn"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <UserCard
                                            user={resultUser}
                                            currentUserId={user.id}
                                            isFollowing={followingIds.includes(resultUser.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <PostFeed initialPosts={results} currentUserId={user.id} feedType="static" />
                        )
                    ) : (
                        <div className="relative rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5" />
                            <div className="relative p-12 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 mb-4">
                                    <span className="text-4xl">🤔</span>
                                </div>
                                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
                                    No results found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                                    We couldn&apos;t find any {type} matching &quot;{query}&quot;. Try a different search term.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
