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

    // Get current user's profile for Navbar
    let currentUserProfile = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        currentUserProfile = data;
    }

    // Get profile being viewed by username
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !profile) {
        notFound();
    }

    const isOwnProfile = user?.id === profile.id;

    // Get user's posts
    const postsResult = await getUserPosts(profile.id, 20, 0);
    const userPosts = (postsResult.success && postsResult.data) ? postsResult.data : [];

    // Get follow counts
    const followCountsResult = await getFollowCounts(profile.id);
    const followCounts = followCountsResult.success
        ? followCountsResult.data
        : { follower_count: 0, following_count: 0 };

    // Check if current user is following this profile
    const isFollowingResult = user ? await isFollowing(profile.id) : null;
    const userIsFollowing = isFollowingResult?.success ? isFollowingResult.data.isFollowing : false;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {user && (
                <Navbar user={currentUserProfile || { id: user.id, username: 'user' }} />
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-3xl font-bold text-white ring-4 ring-white dark:ring-gray-800">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {profile.full_name || profile.username}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
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
                                    <Link href="/settings/profile">
                                        <Button variant="outline" size="sm">
                                            Edit Profile
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="mb-4 text-gray-600 dark:text-gray-300">{profile.bio}</p>
                            )}

                            {/* Stats */}
                            <div className="flex justify-center gap-6 sm:justify-start">
                                <div className="text-center sm:text-left">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {userPosts.length}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                                </div>
                                <Link href={`/profile/${profile.username}/followers`} className="text-center sm:text-left hover:opacity-80 transition-opacity cursor-pointer">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {followCounts.follower_count}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                                </Link>
                                <Link href={`/profile/${profile.username}/following`} className="text-center sm:text-left hover:opacity-80 transition-opacity cursor-pointer">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {followCounts.following_count}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h3>
                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={user?.id}
                            />
                        ))
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
