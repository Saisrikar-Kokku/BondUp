'use client';

import { useNotifications } from '@/contexts/NotificationProvider';
import { useState, useEffect } from 'react';
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { notifications, unreadCount, refreshNotifications, refreshUnreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    // Animate continuously when there are unread notifications and dropdown is closed
    const shouldAnimate = unreadCount > 0 && !isOpen;

    const handleMarkAsRead = async (notificationId: string) => {
        await markAsRead(notificationId);
        refreshNotifications();
        refreshUnreadCount();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        refreshNotifications();
        refreshUnreadCount();
    };

    const getNotificationText = (notification: any) => {
        const actorName = notification.actor?.full_name || notification.actor?.username || 'Someone';

        switch (notification.type) {
            case 'follow':
                return `${actorName} started following you`;
            case 'like':
                return `${actorName} liked your post`;
            case 'comment':
                return `${actorName} commented on your post`;
            default:
                return 'New notification';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200 ${shouldAnimate ? 'animate-ring' : ''
                    }`}
            >
                <svg
                    className={`h-6 w-6 transition-transform duration-200 ${shouldAnimate ? 'scale-110' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Unread Badge with pulse animation */}
                {unreadCount > 0 && (
                    <span
                        className={`absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ${shouldAnimate ? 'animate-pulse-scale' : ''
                            }`}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* Ping animation for new notifications */}
                {shouldAnimate && (
                    <span className="absolute right-0 top-0 flex h-5 w-5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    </span>
                )}
            </button>

            {/* Dropdown with smooth animation */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50 animate-slide-down">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                <p className="mt-2">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={`/profile/${notification.actor?.username}`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`block border-b border-gray-100 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:translate-x-1 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {notification.actor?.avatar_url ? (
                                                <img
                                                    src={notification.actor.avatar_url}
                                                    alt={notification.actor.username}
                                                    className="h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary-500 transition-all"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold">
                                                    {notification.actor?.username?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {getNotificationText(notification)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Unread Indicator with pulse */}
                                        {!notification.is_read && (
                                            <div className="relative">
                                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <div className="absolute inset-0 h-2 w-2 rounded-full bg-blue-500 animate-ping opacity-75"></div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Custom CSS for animations */}
            <style jsx>{`
        @keyframes ring {
          0% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(15deg);
          }
          20% {
            transform: rotate(-15deg);
          }
          30% {
            transform: rotate(10deg);
          }
          40% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(5deg);
          }
          60% {
            transform: rotate(-5deg);
          }
          70% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-scale {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-ring {
          animation: ring 1.5s ease-in-out infinite;
        }

        .animate-pulse-scale {
          animation: pulse-scale 1s ease-in-out infinite;
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
        </div>
    );
}
