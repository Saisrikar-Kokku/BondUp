import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PostFeed } from '@/components/posts/post-feed';
import { getPublicPosts } from '@/lib/actions/posts';
import { Navbar } from '@/components/layout/Navbar';

export default async function ExplorePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile and posts in parallel for faster loading
    const [profileResult, postsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getPublicPosts(20, 0),
    ]);

    const profile = profileResult.data;
    const initialPosts = (postsResult.success && postsResult.data) ? postsResult.data : [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header - Minimal */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                            Explore
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent dark:from-gray-700 dark:via-gray-800" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Discover public posts from everyone on BondUp
                    </p>
                </div>

                {/* Post Feed */}
                {initialPosts.length > 0 ? (
                    <PostFeed initialPosts={initialPosts} currentUserId={user.id} feedType="public" />
                ) : (
                    <div className="rounded-2xl glass-light p-12 text-center shadow-lg">
                        <div className="mx-auto max-w-md">
                            <div className="mb-4 text-5xl opacity-80">🌍</div>
                            <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                                No public posts yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Be the first to share something with the world!
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
