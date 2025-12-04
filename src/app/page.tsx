import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe } from '@/components/ui/globe';
import { RecentSignups } from '@/components/ui/recent-signups';
import { LiveStats } from '@/components/ui/live-stats';
import { LiveActivityCards } from '@/components/ui/live-activity-cards';

export default function Home() {
    return (
        <div className="min-h-screen bg-[#030014] overflow-hidden">
            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <h1 className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
                                BondUp
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Globe */}
            <main className="relative">
                {/* Background gradient effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
                    <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)] py-12">
                        {/* Left side - Text content */}
                        <div className="text-center lg:text-left space-y-8 z-10">
                            <div className="space-y-4">
                                <p className="text-violet-400 font-medium tracking-wide uppercase text-sm">
                                    Connect Globally
                                </p>
                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                    Connect with
                                    <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Friends Worldwide
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
                                    Share moments, engage with communities, and stay connected with people
                                    across the globe. Join millions on BondUp.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-xl border-0 shadow-lg shadow-violet-500/25">
                                        Get Started Free
                                        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Button>
                                </Link>
                                <Link href="/explore">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                                        Explore Features
                                    </Button>
                                </Link>
                            </div>

                            {/* Stats - Real-time from database */}
                            <LiveStats />
                        </div>

                        {/* Right side - Globe */}
                        <div className="relative flex items-center justify-center lg:justify-center overflow-visible py-10 lg:py-0">
                            <div className="relative" style={{ minWidth: '350px', minHeight: '350px' }}>
                                {/* Globe - responsive size */}
                                <div className="hidden lg:block">
                                    <Globe size={450} />
                                </div>
                                <div className="block lg:hidden">
                                    <Globe size={320} />
                                </div>

                                {/* Live activity cards around globe - real-time data */}
                                <LiveActivityCards />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Signups Section */}
                <div className="relative py-16 border-t border-white/5">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl font-bold text-white mb-4">Join Our Growing Community</h3>
                                <p className="text-gray-400 mb-6">
                                    See who's joining BondUp in real-time. Be part of a thriving community of creators,
                                    professionals, and friends from around the world.
                                </p>
                                <Link href="/signup">
                                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0">
                                        Join Now
                                    </Button>
                                </Link>
                            </div>
                            <div>
                                <RecentSignups />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="relative py-24 border-t border-white/5">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl font-bold text-white mb-4">Everything you need to connect</h3>
                            <p className="text-gray-400 max-w-2xl mx-auto">Powerful features designed to help you build meaningful connections across the world.</p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/20">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
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
        <div className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105">
            <div className="mb-4 text-4xl">{icon}</div>
            <h4 className="mb-2 text-xl font-semibold text-white">{title}</h4>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}
