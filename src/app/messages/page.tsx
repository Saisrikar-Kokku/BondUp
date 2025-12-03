import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Your Messages
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Select a conversation from the list or start a new one from a user&apos;s profile.
            </p>
        </div>
    );
}
