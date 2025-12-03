import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <h1 className="mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-3xl font-bold text-transparent">
                            BondUp
                        </h1>
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                            <svg
                                className="h-8 w-8 text-primary-600 dark:text-primary-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    </div>

                    <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Check your email
                    </h2>

                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                        We&apos;ve sent you a verification link. Please check your email and click the link to
                        verify your account.
                    </p>

                    <div className="space-y-3">
                        <Link href="/login">
                            <Button className="w-full">Go to Login</Button>
                        </Link>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Didn&apos;t receive the email? Check your spam folder or contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
