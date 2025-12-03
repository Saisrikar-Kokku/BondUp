'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startConversation } from '@/lib/actions/messages';
import { useState } from 'react';

interface MessageButtonProps {
    targetUserId: string;
    className?: string;
}

export function MessageButton({ targetUserId, className }: MessageButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleMessage = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation if inside a Link
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        const result = await startConversation(targetUserId);

        if (result.success && result.data) {
            router.push(`/messages/${result.data.id}`);
        } else {
            console.error('Failed to start conversation:', result.error);
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={handleMessage}
            disabled={isLoading}
        >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
        </Button>
    );
}
