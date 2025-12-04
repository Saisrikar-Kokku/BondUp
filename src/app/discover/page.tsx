import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { UserCard } from '@/components/profile/user-card';
import { Navbar } from '@/components/layout/Navbar';

export default async function DiscoverPage() {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        notFound();
    }

    // Fetch profile and following list in parallel
    const [profileResult, followingResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('followers').select('following_id').eq('follower_id', user.id),
    ]);

    const profile = profileResult.data;
    const followingIds = followingResult.data?.map((f) => f.following_id) || [];
    followingIds.push(user.id); // Exclude self

    // Get suggested users (users not being followed, newest first)
    const { data: suggestedUsers } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${followingIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(20);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Discover People</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Find and connect with interesting people on BondUp
                    </p>
                </div>

                {/* Suggested Users */}
                <div className="space-y-3">
                    {suggestedUsers && suggestedUsers.length > 0 ? (
                        suggestedUsers.map((suggestedUser) => (
                            <UserCard key={suggestedUser.id} user={suggestedUser} currentUserId={user.id} />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="mx-auto max-w-md">
                                <div className="mb-4 text-6xl">👥</div>
                                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                                    No suggestions available
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    You&apos;re already following everyone! Check back later for new users.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
