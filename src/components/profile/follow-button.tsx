'use client';

import { useState } from 'react';
import { followUser, unfollowUser } from '@/lib/actions/follows';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
    userId: string;
    initialIsFollowing: boolean;
    size?: 'sm' | 'default' | 'lg';
}

export function FollowButton({ userId, initialIsFollowing, size = 'default' }: FollowButtonProps) {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);

        if (isFollowing) {
            // Optimistically update UI
            setIsFollowing(false);

            const result = await unfollowUser(userId);

            if (!result.success) {
                // Revert on error
                setIsFollowing(true);
                alert(result.error || 'Failed to unfollow user');
            } else {
                router.refresh();
            }
        } else {
            // Optimistically update UI
            setIsFollowing(true);

            const result = await followUser(userId);

            if (!result.success) {
                // Revert on error
                setIsFollowing(false);
                alert(result.error || 'Failed to follow user');
            } else {
                router.refresh();
            }
        }

        setLoading(false);
    };

    return (
        <Button
            onClick={handleFollow}
            disabled={loading}
            size={size}
            variant={isFollowing ? 'outline' : 'default'}
        >
            {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}
