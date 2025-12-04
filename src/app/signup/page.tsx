'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import { validateEmail, validatePassword, validateUsername } from '@/lib/utils/validation';
import { Check, X } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        fullName: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Password strength checks
    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (error) setError(null);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.errors[0];
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            errors.username = usernameValidation.error!;
        }

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const result = await signUp(
                formData.email,
                formData.password,
                formData.username,
                formData.fullName
            );

            if (!result.success) {
                setError(result.error || 'Failed to create account');
                return;
            }

            router.push('/verify-email');
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold mb-4">BondUp</h1>
                        <p className="text-xl text-white/80 leading-relaxed">
                            Join thousands of people connecting and sharing their stories.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white/90">Free to use, forever</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span className="text-white/90">Your data is secure</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-white/90">Set up in seconds</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-950 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-violet-600">BondUp</h1>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create account</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Get started with your free account
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            {fieldErrors.email && <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>}
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="johndoe"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            {fieldErrors.username && <p className="mt-1 text-sm text-red-500">{fieldErrors.username}</p>}
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Full name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            {fieldErrors.fullName && <p className="mt-1 text-sm text-red-500">{fieldErrors.fullName}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            {fieldErrors.password && <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>}

                            {/* Password strength */}
                            {formData.password && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {Object.entries(passwordChecks).map(([key, passed]) => (
                                        <div key={key} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                            {passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                            <span>{key === 'length' ? '8+ characters' : key === 'uppercase' ? 'Uppercase' : key === 'lowercase' ? 'Lowercase' : 'Number'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                        <span className="text-sm text-gray-500">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    </div>

                    {/* Google signup */}
                    <button className="w-full py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Continue with Google</span>
                    </button>

                    {/* Sign in link */}
                    <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                            Sign in
                        </Link>
                    </p>

                    {/* Terms */}
                    <p className="mt-4 text-center text-xs text-gray-500">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-violet-600 hover:underline">Terms</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
