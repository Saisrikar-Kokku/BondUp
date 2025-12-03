import * as React from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    className={clsx(
                        'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
                        'placeholder:text-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800',
                        className
                    )}
                    ref={ref}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={
                        error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
                    }
                    {...props}
                />
                {error && (
                    <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={`${textareaId}-helper`}
                        className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export { Textarea };
