'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CommentWithProfile } from '@/types/database.types';
import { formatRelativeTime } from '@/lib/utils/date';
import { deleteComment, updateComment } from '@/lib/actions/comments';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CommentItemProps {
    comment: CommentWithProfile;
    currentUserId?: string;
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleted, setIsDeleted] = useState(false);

    const isOwnComment = currentUserId === comment.user_id;

    const handleUpdate = async () => {
        if (!editContent.trim()) {
            setError('Comment cannot be empty');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await updateComment(comment.id, editContent);

        if (!result.success) {
            setError(result.error || 'Failed to update comment');
            setLoading(false);
            return;
        }

        setIsEditing(false);
        setLoading(false);
        router.refresh();
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        setLoading(true);
        const result = await deleteComment(comment.id);

        if (!result.success) {
            alert(result.error || 'Failed to delete comment');
            setLoading(false);
            return;
        }

        // Hide the comment immediately
        setIsDeleted(true);
        // Then refresh to update counts
        router.refresh();
    };

    // Don't render if deleted
    if (isDeleted) {
        return null;
    }

    return (
        <div className="flex gap-3 py-3">
            {/* Avatar */}
            <Link href={`/profile/${comment.profiles.username}`}>
                {comment.profiles.avatar_url ? (
                    <img
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.username}
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-xs font-bold text-white">
                        {comment.profiles.username.charAt(0).toUpperCase()}
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/profile/${comment.profiles.username}`}
                        className="font-semibold text-gray-900 hover:underline dark:text-white"
                    >
                        {comment.profiles.full_name || comment.profiles.username}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(comment.created_at)}
                    </span>
                </div>

                {isEditing ? (
                    <div className="mt-1">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                            disabled={loading}
                            maxLength={500}
                        />
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                        <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={loading}>
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content);
                                    setError(null);
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                        {isOwnComment && (
                            <div className="mt-1 flex gap-3 text-xs">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    disabled={loading}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
