'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PostWithInteractions } from '@/types/database.types';
import { PostCard } from './post-card';
import { EditPostModal } from './edit-post-modal';
import { getFollowingPosts, getPublicPosts } from '@/lib/actions/posts';

interface PostFeedProps {
    initialPosts?: PostWithInteractions[];
    currentUserId?: string;
    feedType: 'following' | 'public' | 'static';
}

export function PostFeed({ initialPosts = [], currentUserId, feedType }: PostFeedProps) {
    const [posts, setPosts] = useState<PostWithInteractions[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [editingPost, setEditingPost] = useState<PostWithInteractions | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore || feedType === 'static') return;

        setLoading(true);
        const fetchFn = feedType === 'following' ? getFollowingPosts : getPublicPosts;
        const result = await fetchFn(10, posts.length);

        if (result.success && result.data) {
            if (result.data.length === 0) {
                setHasMore(false);
            } else {
                setPosts((prev) => [...prev, ...result.data!]);
            }
        }
        setLoading(false);
    }, [loading, hasMore, feedType, posts.length]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 500
            ) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    if (posts.length === 0 && !loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-md">
                    <div className="mb-4 text-6xl">📝</div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                        No posts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Be the first to share something with the community!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onEdit={setEditingPost}
                    />
                ))}

                {loading && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                                <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                        </div>
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        You&apos;ve reached the end!
                    </p>
                )}
            </div>

            {editingPost && (
                <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} />
            )}
        </>
    );
}
