'use server';

import { createClient } from '@/lib/supabase/server';
import type { ProfileUpdate } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface ProfileResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Get profile by username
 */
export async function getProfile(username: string): Promise<ProfileResult> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<ProfileResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: ProfileUpdate): Promise<ProfileResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // If username is being updated, check if it's available
        if (updates.username) {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', updates.username)
                .neq('id', user.id)
                .single();

            if (existingProfile) {
                return {
                    success: false,
                    error: 'Username is already taken',
                };
            }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        // Revalidate all profile-related pages
        revalidatePath('/profile/[username]', 'page');
        revalidatePath('/profile/edit', 'page');
        revalidatePath('/feed', 'page');
        revalidatePath('/discover', 'page');
        revalidatePath('/explore', 'page');

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
