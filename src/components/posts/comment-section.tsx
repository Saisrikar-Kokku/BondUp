'use client';

import { useState, useEffect } from 'react';
import type { CommentWithProfile } from '@/types/database.types';
import { CommentItem } from './comment-item';
import { CommentInput } from './comment-input';
import { getPostComments } from '@/lib/actions/comments';

interface CommentSectionProps {
    postId: string;
    initialComments?: CommentWithProfile[];
    currentUserId?: string;
}

export function CommentSection({ postId, initialComments = [], currentUserId }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentWithProfile[]>(initialComments);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialComments.length >= 10);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const result = await getPostComments(postId, 10, comments.length);

        if (result.success && result.data) {
            if (result.data.length === 0) {
                setHasMore(false);
            } else {
                setComments((prev) => [...prev, ...result.data]);
            }
        }
        setLoading(false);
    };

    if (comments.length === 0) {
        return (
            <div className="mt-4">
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                <CommentInput postId={postId} />
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="space-y-1">
                {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} />
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loading}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 dark:text-primary-400"
                >
                    {loading ? 'Loading...' : 'Load more comments'}
                </button>
            )}

            <div className="mt-4">
                <CommentInput postId={postId} />
            </div>
        </div>
    );
}
