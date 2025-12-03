import { Profile, Post } from './database.types';

// Notification type definitions
export interface Notification {
    id: string;
    user_id: string;
    actor_id: string;
    type: 'follow' | 'like' | 'comment' | 'mention';
    post_id?: string;
    comment_id?: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationWithActor extends Notification {
    actor: Profile;
    post?: Post;
}
