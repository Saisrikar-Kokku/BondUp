import * as React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={clsx(
                        'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
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
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
