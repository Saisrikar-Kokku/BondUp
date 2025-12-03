'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormError } from '@/components/ui/form';
import { signUp } from '@/lib/actions/auth';
import { validateEmail, validatePassword, validateUsername } from '@/lib/utils/validation';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear field error when user types
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Email validation
        if (!validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.errors[0];
        }

        // Confirm password
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Username validation
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            errors.username = usernameValidation.error!;
        }

        // Full name validation
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

            // Redirect to verify email page
            router.push('/verify-email');
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/">
                        <h1 className="mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-3xl font-bold text-transparent">
                            BondUp
                        </h1>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400">Create your account</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <Form onSubmit={handleSubmit}>
                        {error && (
                            <FormField>
                                <FormError error={error} />
                            </FormField>
                        )}

                        <FormField>
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={fieldErrors.email}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </FormField>

                        <FormField>
                            <Input
                                label="Username"
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                error={fieldErrors.username}
                                placeholder="johndoe"
                                helperText="3-30 characters, letters, numbers, and underscores only"
                                required
                                disabled={loading}
                            />
                        </FormField>

                        <FormField>
                            <Input
                                label="Full Name"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                error={fieldErrors.fullName}
                                placeholder="John Doe"
                                required
                                disabled={loading}
                            />
                        </FormField>

                        <FormField>
                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                error={fieldErrors.password}
                                placeholder="••••••••"
                                helperText="At least 8 characters with uppercase, lowercase, and numbers"
                                required
                                disabled={loading}
                            />
                        </FormField>

                        <FormField>
                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={fieldErrors.confirmPassword}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </FormField>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </Form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
