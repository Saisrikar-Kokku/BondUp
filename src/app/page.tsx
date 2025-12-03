import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <h1 className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-2xl font-bold text-transparent">
                                BondUp
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="ghost">Log In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button>Sign Up</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 text-center">
                    <div className="animate-slide-up space-y-6">
                        <h2 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl">
                            Connect with
                            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                {' '}
                                Friends
                            </span>
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                            Share moments, engage with communities, and stay connected with the people who
                            matter most. Join BondUp today.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Get Started
                                    <svg
                                        className="ml-2 h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </Button>
                            </Link>
                            <Link href="/explore">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    Explore Features
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon="💬"
                            title="Real-Time Chat"
                            description="Connect instantly with friends through our lightning-fast messaging system."
                        />
                        <FeatureCard
                            icon="📸"
                            title="Share Moments"
                            description="Post photos, videos, and updates to share your life with your community."
                        />
                        <FeatureCard
                            icon="🔔"
                            title="Stay Updated"
                            description="Get real-time notifications for likes, comments, and messages."
                        />
                        <FeatureCard
                            icon="🔍"
                            title="Discover Content"
                            description="Explore trending posts and discover new people to follow."
                        />
                        <FeatureCard
                            icon="❤️"
                            title="Engage & Interact"
                            description="Like, comment, and share posts from your favorite creators."
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Privacy First"
                            description="Your data is secure with enterprise-grade encryption and privacy controls."
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        © 2024 BondUp. Built with Next.js and Supabase.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-105 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 text-4xl">{icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
    );
}
