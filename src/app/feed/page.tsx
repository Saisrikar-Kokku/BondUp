import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreatePost } from '@/components/posts/create-post';
import { PostFeed } from '@/components/posts/post-feed';
import { getFollowingPosts } from '@/lib/actions/posts';
import { Navbar } from '@/components/layout/Navbar';
import { StoryBar } from '@/components/stories/story-bar';

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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header with gradient text */}
                <div className="mb-8">
                    <h2 className="mb-2 text-3xl font-bold bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 bg-clip-text text-transparent">
                        Your Feed
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        See what your connections are sharing ✨
                    </p>
                </div>

                {/* Stories Section - Premium Container */}
                <div className="mb-6 -mx-2 px-2">
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 dark:border-gray-800/50">
                        <StoryBar
                            currentUserId={user.id}
                            currentUserAvatar={profile?.avatar_url}
                            currentUsername={profile?.username || 'user'}
                        />
                    </div>
                </div>

                {/* Create Post */}
                <div className="mb-6">
                    <CreatePost />
                </div>

                {/* Divider */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-4 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                            Latest Posts
                        </span>
                    </div>
                </div>

                {/* Post Feed */}
                <PostFeed initialPosts={initialPosts} currentUserId={user.id} feedType="following" />
            </main>
        </div>
    );
}
