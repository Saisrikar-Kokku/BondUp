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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0 overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
                <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            <Navbar user={profile || { id: user.id, username: 'user' }} />

            {/* Main Content */}
            <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        {suggestedUsers?.length || 0} new people to discover
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Discover
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Find your next connection. Follow interesting people and grow your network.
                    </p>
                </div>

                {/* Suggested Users - Beautiful Grid */}
                {suggestedUsers && suggestedUsers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {suggestedUsers.map((suggestedUser, index) => (
                            <div
                                key={suggestedUser.id}
                                className="animate-fadeIn"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <UserCard user={suggestedUser} currentUserId={user.id} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="relative rounded-3xl overflow-hidden">
                        {/* Gradient border effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-20" />
                        <div className="relative m-[1px] rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-16 text-center">
                            <div className="mx-auto max-w-md">
                                <div className="mb-6 text-7xl">🎯</div>
                                <h3 className="mb-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                    You&apos;ve found everyone!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Amazing! You&apos;re already connected with all our users. Check back later for new people to discover.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
