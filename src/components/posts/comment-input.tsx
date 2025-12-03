'use client';

import { useState } from 'react';
import { createComment } from '@/lib/actions/comments';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CommentInputProps {
    postId: string;
}

export function CommentInput({ postId }: CommentInputProps) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!content.trim()) {
            setError('Comment cannot be empty');
            return;
        }

        setLoading(true);

        try {
            const result = await createComment(postId, content);

            if (!result.success) {
                setError(result.error || 'Failed to post comment');
                setLoading(false);
                return;
            }

            // Reset form and refresh
            setContent('');
            setLoading(false);
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                    maxLength={500}
                />
                <Button type="submit" disabled={loading || !content.trim()} size="sm">
                    {loading ? 'Posting...' : 'Post'}
                </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">{content.length}/500</p>
        </form>
    );
}
