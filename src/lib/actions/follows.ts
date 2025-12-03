'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface FollowResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<FollowResult> {
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

        if (user.id === userId) {
            return {
                success: false,
                error: 'Cannot follow yourself',
            };
        }

        const { data, error } = await supabase
            .from('followers')
            .insert({
                follower_id: user.id,
                following_id: userId,
            })
            .select()
            .single();

        if (error) {
            // Check if already following
            if (error.code === '23505') {
                return {
                    success: false,
                    error: 'Already following this user',
                };
            }
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/feed');
        revalidatePath('/profile/[username]', 'page');
        revalidatePath('/discover');

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
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<FollowResult> {
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

        const { error } = await supabase
            .from('followers')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', userId);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/feed');
        revalidatePath('/profile/[username]', 'page');
        revalidatePath('/discover');

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Check if current user is following a specific user
 */
export async function isFollowing(userId: string): Promise<FollowResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: true,
                data: { isFollowing: false },
            };
        }

        const { data, error } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows returned"
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data: { isFollowing: !!data },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get follower and following counts for a user
 */
export async function getFollowCounts(userId: string): Promise<FollowResult> {
    try {
        const supabase = await createClient();

        // Get follower count
        const { count: followerCount, error: followerError } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        if (followerError) {
            return {
                success: false,
                error: followerError.message,
            };
        }

        // Get following count
        const { count: followingCount, error: followingError } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        if (followingError) {
            return {
                success: false,
                error: followingError.message,
            };
        }

        return {
            success: true,
            data: {
                follower_count: followerCount || 0,
                following_count: followingCount || 0,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get list of followers for a user
 */
export async function getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
): Promise<FollowResult> {
    try {
        const supabase = await createClient();

        // 1. Get follower IDs
        const { data: followers, error: followersError } = await supabase
            .from('followers')
            .select('id, follower_id, created_at')
            .eq('following_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (followersError) {
            return {
                success: false,
                error: followersError.message,
            };
        }

        if (!followers || followers.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        const followerIds = followers.map((f) => f.follower_id);

        // 2. Get profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .in('id', followerIds);

        if (profilesError) {
            return {
                success: false,
                error: profilesError.message,
            };
        }

        // 3. Combine data
        const combined = followers.map((f) => {
            const profile = profiles?.find((p) => p.id === f.follower_id);
            return {
                ...f,
                follower: profile,
            };
        });

        return {
            success: true,
            data: combined,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get list of users that a user is following
 */
export async function getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
): Promise<FollowResult> {
    try {
        const supabase = await createClient();

        // 1. Get following IDs
        const { data: following, error: followingError } = await supabase
            .from('followers')
            .select('id, following_id, created_at')
            .eq('follower_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (followingError) {
            return {
                success: false,
                error: followingError.message,
            };
        }

        if (!following || following.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        const followingIds = following.map((f) => f.following_id);

        // 2. Get profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .in('id', followingIds);

        if (profilesError) {
            return {
                success: false,
                error: profilesError.message,
            };
        }

        // 3. Combine data
        const combined = following.map((f) => {
            const profile = profiles?.find((p) => p.id === f.following_id);
            return {
                ...f,
                following: profile,
            };
        });

        return {
            success: true,
            data: combined,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Check if two users mutually follow each other
 */
export async function isMutualFollow(userId: string): Promise<FollowResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: true,
                data: { isMutual: false },
            };
        }

        // Check if current user follows target user
        const { data: following } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();

        // Check if target user follows current user back
        const { data: follower } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', user.id)
            .single();

        return {
            success: true,
            data: {
                isMutual: !!following && !!follower,
                youFollow: !!following,
                theyFollow: !!follower,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get all following IDs for a user (for efficient checks)
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', userId);

        if (error) {
            console.error('Error fetching following IDs:', error);
            return [];
        }

        return data.map(f => f.following_id);
    } catch (error) {
        console.error('Unexpected error fetching following IDs:', error);
        return [];
    }
}
