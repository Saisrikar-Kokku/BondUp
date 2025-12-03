'use client';

import * as React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    children: React.ReactNode;
}

export function Form({ children, onSubmit, ...props }: FormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    return (
        <form onSubmit={handleSubmit} {...props}>
            {children}
        </form>
    );
}

interface FormFieldProps {
    children: React.ReactNode;
    className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
    return <div className={className || 'mb-4'}>{children}</div>;
}

interface FormErrorProps {
    error?: string | null;
}

export function FormError({ error }: FormErrorProps) {
    if (!error) return null;

    return (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
        </div>
    );
}

interface FormSuccessProps {
    message?: string | null;
}

export function FormSuccess({ message }: FormSuccessProps) {
    if (!message) return null;

    return (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {message}
        </div>
    );
}
