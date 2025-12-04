'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface AuthResult {
    success: boolean;
    error?: string;
}

/**
 * Sign up a new user
 */
export async function signUp(
    email: string,
    password: string,
    username: string,
    fullName: string
): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        // Check if username is already taken
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingProfile) {
            return {
                success: false,
                error: 'Username is already taken',
            };
        }

        // Create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    full_name: fullName,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        if (!data.user) {
            return {
                success: false,
                error: 'Failed to create user',
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Sign in an existing user
 * @param persistSession - If true, session persists across browser restarts
 */
export async function signIn(
    email: string,
    password: string,
    persistSession: boolean = true
): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // If user doesn't want to stay signed in, set a shorter session
        // Note: Supabase handles session persistence via cookies
        // We'll store the preference in localStorage on the client side

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/', 'layout');
        redirect('/');
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
        });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}
