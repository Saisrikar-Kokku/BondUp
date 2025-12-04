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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Explore</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Discover public posts from everyone on BondUp
                    </p>
                </div>

                {/* Post Feed */}
                {initialPosts.length > 0 ? (
                    <PostFeed initialPosts={initialPosts} currentUserId={user.id} feedType="public" />
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="mx-auto max-w-md">
                            <div className="mb-4 text-6xl">🌍</div>
                            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                                No public posts yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Be the first to share something with the world!
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
