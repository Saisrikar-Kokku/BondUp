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

    // Get user profile for Navbar
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Get following IDs for follow status check
    const followingIds = await getFollowingIds(user.id);

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Search</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Find people and posts on BondUp
                    </p>
                </div>

                <div className="mb-8 space-y-6">
                    <SearchBar />
                    <SearchTabs />
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {!hasSearched ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-gray-500 dark:text-gray-400">
                                Type something to start searching
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        type === 'people' ? (
                            <div className="space-y-4">
                                {results.map((resultUser: any) => (
                                    <UserCard
                                        key={resultUser.id}
                                        user={resultUser}
                                        currentUserId={user.id}
                                        isFollowing={followingIds.includes(resultUser.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <PostFeed initialPosts={results} currentUserId={user.id} feedType="static" />
                        )
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">😕</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No results found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                We couldn&apos;t find any {type} matching &quot;{query}&quot;
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
