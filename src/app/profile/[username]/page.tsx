import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/posts/post-card';
import { getUserPosts } from '@/lib/actions/posts';
import { getFollowCounts, isFollowing } from '@/lib/actions/follows';
import { FollowButton } from '@/components/profile/follow-button';
import { MessageButton } from '@/components/messages/message-button';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfilePageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch profile being viewed and current user profile in parallel
    const [profileResult, currentUserProfileResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('username', username).single(),
        user ? supabase.from('profiles').select('*').eq('id', user.id).single() : Promise.resolve({ data: null }),
    ]);

    const profile = profileResult.data;
    const currentUserProfile = currentUserProfileResult.data;

    if (profileResult.error || !profile) {
        notFound();
    }

    const isOwnProfile = user?.id === profile.id;

    // Fetch posts, follow counts, and following status in parallel
    const [postsResult, followCountsResult, isFollowingResult] = await Promise.all([
        getUserPosts(profile.id, 20, 0),
        getFollowCounts(profile.id),
        user ? isFollowing(profile.id) : Promise.resolve(null),
    ]);

    const userPosts = (postsResult.success && postsResult.data) ? postsResult.data : [];
    const followCounts = followCountsResult.success
        ? followCountsResult.data
        : { follower_count: 0, following_count: 0 };
    const userIsFollowing = isFollowingResult?.success ? isFollowingResult.data.isFollowing : false;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
            {user && (
                <Navbar user={currentUserProfile || { id: user.id, username: 'user' }} />
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Profile Header - Glassmorphism */}
                <div className="mb-8 rounded-2xl glass-light shadow-xl dark:shadow-2xl p-6 overflow-hidden relative">
                    {/* Decorative gradient orb */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-400/30 to-purple-500/30 rounded-full blur-3xl" />

                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start relative z-10">
                        {/* Avatar with gradient ring */}
                        <div className="flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-full p-1 animate-pulse" style={{ animationDuration: '3s' }} />
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="relative h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 m-1"
                                />
                            ) : (
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-3xl font-bold text-white ring-4 ring-white dark:ring-gray-800 m-1">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                                        {profile.full_name || profile.username}
                                    </h1>
                                    <p className="text-primary-500 dark:text-primary-400 font-medium">@{profile.username}</p>
                                </div>
                                {user && !isOwnProfile && (
                                    <div className="flex gap-2">
                                        <MessageButton targetUserId={profile.id} />
                                        <FollowButton
                                            userId={profile.id}
                                            initialIsFollowing={userIsFollowing}
                                        />
                                    </div>
                                )}
                                {isOwnProfile && (
                                    <Link href="/profile/edit">
                                        <Button variant="outline" size="sm">
                                            Edit Profile
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="mb-4 text-gray-600 dark:text-gray-300">{profile.bio}</p>
                            )}

                            {/* Stats - Glass cards */}
                            <div className="flex justify-center gap-4 sm:justify-start">
                                <div className="text-center px-4 py-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <div className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                                        {userPosts.length}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Posts</div>
                                </div>
                                <Link href={`/profile/${profile.username}/followers`} className="text-center px-4 py-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                    <div className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                                        {followCounts.follower_count}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Followers</div>
                                </Link>
                                <Link href={`/profile/${profile.username}/following`} className="text-center px-4 py-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                    <div className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                                        {followCounts.following_count}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Following</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Posts</h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent dark:from-gray-700 dark:via-gray-800" />
                    </div>
                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={user?.id}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl glass-light p-12 text-center shadow-lg">
                            <div className="text-5xl mb-3">📝</div>
                            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
