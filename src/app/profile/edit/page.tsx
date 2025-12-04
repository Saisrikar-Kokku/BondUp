'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormError, FormSuccess } from '@/components/ui/form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { getCurrentProfile, updateProfile } from '@/lib/actions/profile';
import { validateUsername, validateBio } from '@/lib/utils/validation';
import type { Profile } from '@/types/database.types';

function EditProfileContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        bio: '',
        avatarUrl: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const result = await getCurrentProfile();
        if (!result.success || !result.data) {
            setError('Failed to load profile');
            setLoading(false);
            return;
        }

        setProfile(result.data);
        setFormData({
            username: result.data.username,
            fullName: result.data.full_name || '',
            bio: result.data.bio || '',
            avatarUrl: result.data.avatar_url || '',
        });
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear field error when user types
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Username validation
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            errors.username = usernameValidation.error!;
        }

        // Bio validation
        if (!validateBio(formData.bio)) {
            errors.bio = 'Bio must be 500 characters or less';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const result = await updateProfile({
                username: formData.username,
                full_name: formData.fullName || null,
                bio: formData.bio || null,
                avatar_url: formData.avatarUrl || null,
            });

            if (!result.success) {
                console.error('Profile update failed:', result.error);
                setError(result.error || 'Failed to update profile');
                return;
            }

            setSuccess('Profile updated successfully!');
            // Refresh the router cache before navigation
            router.refresh();
            setTimeout(() => {
                router.push(`/profile/${formData.username}`);
            }, 1500);
        } catch (err) {
            console.error('Profile update exception:', err);
            setError('An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = (url: string) => {
        setFormData((prev) => ({ ...prev, avatarUrl: url }));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-red-600">Failed to load profile</p>
                    <Link href="/feed">
                        <Button className="mt-4">Go to Feed</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/feed">
                            <h1 className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-2xl font-bold text-transparent">
                                BondUp
                            </h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href={`/profile/${profile.username}`}>
                                <Button variant="ghost">Cancel</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Edit Profile Form */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Update your profile information
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <Form onSubmit={handleSubmit}>
                        {error && (
                            <FormField>
                                <FormError error={error} />
                            </FormField>
                        )}

                        {success && (
                            <FormField>
                                <FormSuccess message={success} />
                            </FormField>
                        )}

                        {/* Avatar Upload */}
                        <FormField>
                            <AvatarUpload
                                currentAvatarUrl={formData.avatarUrl}
                                userId={profile.id}
                                onUploadComplete={handleAvatarUpload}
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
                                helperText="3-30 characters, letters, numbers, and underscores only"
                                required
                                disabled={saving}
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
                                disabled={saving}
                            />
                        </FormField>

                        <FormField>
                            <Textarea
                                label="Bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                error={fieldErrors.bio}
                                helperText={`${formData.bio.length}/500 characters`}
                                rows={4}
                                disabled={saving}
                            />
                        </FormField>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={saving} className="flex-1">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Link href={`/profile/${profile.username}`} className="flex-1">
                                <Button type="button" variant="outline" className="w-full" disabled={saving}>
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </Form>
                </div>
            </main>
        </div>
    );
}

export default function EditProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        }>
            <EditProfileContent />
        </Suspense>
    );
}
