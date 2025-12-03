import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { UserList } from '@/components/profile/user-list';
import { getFollowers, getFollowingIds, isMutualFollow } from '@/lib/actions/follows';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FollowersPageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
    const { username } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Get current user profile for Navbar
    let currentUserProfile = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        currentUserProfile = data;
    }

    // Get profile being viewed
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        notFound();
    }

    // Check privacy
    const isOwnProfile = user?.id === profile.id;
    let canView = isOwnProfile;

    if (!isOwnProfile && user) {
        const mutualResult = await isMutualFollow(profile.id);
        if (mutualResult.success && mutualResult.data?.isMutual) {
            canView = true;
        }
    }

    // Get followers only if allowed
    let followers: any[] = [];
    if (canView) {
        const followersResult = await getFollowers(profile.id);
        followers = followersResult.success ? followersResult.data : [];
    }

    // Get following IDs for current user to check follow status
    const followingIds = user ? await getFollowingIds(user.id) : [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {user && (
                <Navbar user={currentUserProfile || { id: user.id, username: 'user' }} />
            )}

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href={`/profile/${username}`}
                        className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Followers</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{username}</p>
                    </div>
                </div>

                {canView ? (
                    <UserList
                        users={followers}
                        currentUserId={user?.id || ''}
                        followingIds={followingIds}
                        emptyMessage={`@${username} has no followers yet`}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                            <span className="text-4xl">🔒</span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Private List
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Follow @{username} and wait for them to follow you back to see their followers.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
