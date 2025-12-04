import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreatePost } from '@/components/posts/create-post';
import { PostFeed } from '@/components/posts/post-feed';
import { getFollowingPosts } from '@/lib/actions/posts';
import { Navbar } from '@/components/layout/Navbar';

export default async function FeedPage() {
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
        getFollowingPosts(10, 0),
    ]);

    const profile = profileResult.data;
    const initialPosts = (postsResult.success && postsResult.data) ? postsResult.data : [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Following</h2>
                    <p className="text-gray-600 dark:text-gray-400">Posts from people you follow</p>
                </div>

                {/* Create Post */}
                <div className="mb-6">
                    <CreatePost />
                </div>

                {/* Post Feed */}
                <PostFeed initialPosts={initialPosts} currentUserId={user.id} feedType="following" />
            </main>
        </div>
    );
}
