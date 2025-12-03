import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { UserList } from '@/components/profile/user-list';
import { getFollowing, getFollowingIds } from '@/lib/actions/follows';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FollowingPageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function FollowingPage({ params }: FollowingPageProps) {
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

    // Get following
    const followingResult = await getFollowing(profile.id);
    const following = followingResult.success ? followingResult.data : [];

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Following</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{username}</p>
                    </div>
                </div>

                <UserList
                    users={following}
                    currentUserId={user?.id || ''}
                    followingIds={followingIds}
                    emptyMessage={`@${username} is not following anyone yet`}
                />
            </main>
        </div>
    );
}
