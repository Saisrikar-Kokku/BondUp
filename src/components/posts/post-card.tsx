'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PostWithInteractions } from '@/types/database.types';
import { formatRelativeTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { deletePost } from '@/lib/actions/posts';
import { LikeButton } from './like-button';
import { CommentSection } from './comment-section';
import { getPostComments } from '@/lib/actions/comments';

interface PostCardProps {
    post: PostWithInteractions;
    currentUserId?: string;
    onEdit?: (post: PostWithInteractions) => void;
}

export function PostCard({ post, currentUserId, onEdit }: PostCardProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const isOwnPost = currentUserId === post.user_id;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        setDeleting(true);
        const result = await deletePost(post.id);
        if (!result.success) {
            alert(result.error || 'Failed to delete post');
            setDeleting(false);
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            await loadComments();
        }
        setShowComments(!showComments);
    };

    const loadComments = async () => {
        setLoadingComments(true);
        const result = await getPostComments(post.id);
        if (result.success && result.data) {
            setComments(result.data);
        }
        setLoadingComments(false);
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <Link
                    href={`/profile/${post.profiles.username}`}
                    className="flex items-center gap-3 hover:opacity-80"
                >
                    {post.profiles.avatar_url ? (
                        <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.username}
                            className="h-12 w-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-lg font-bold text-white">
                            {post.profiles.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {post.profiles.full_name || post.profiles.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{post.profiles.username} · {formatRelativeTime(post.created_at)}
                        </p>
                    </div>
                </Link>

                {/* Menu for own posts */}
                {isOwnPost && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={deleting}
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onEdit?.(post);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleDelete();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <p className="mb-4 whitespace-pre-wrap text-gray-900 dark:text-white">{post.content}</p>

            {/* Images - Modern Carousel */}
            {post.post_attachments && post.post_attachments.length > 0 && (
                <div className="mb-4 -mx-6">
                    <ImageCarousel
                        images={post.post_attachments}
                        className="rounded-none sm:rounded-xl sm:mx-6"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <LikeButton
                    postId={post.id}
                    initialLikeCount={post.like_count}
                    initialUserHasLiked={post.user_has_liked}
                />
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{post.comment_count}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4">
                    {loadingComments ? (
                        <p className="text-sm text-gray-500">Loading comments...</p>
                    ) : (
                        <CommentSection postId={post.id} initialComments={comments} currentUserId={currentUserId} />
                    )}
                </div>
            )}
        </div>
    );
}
