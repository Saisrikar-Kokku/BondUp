// Email validation
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Alias for backward compatibility
export const validateEmail = isValidEmail;

// Password validation
export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Calculate strength
    if (errors.length === 0) {
        if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            strength = 'strong';
        } else if (password.length >= 10) {
            strength = 'medium';
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
    };
}

// Username validation
export interface UsernameValidation {
    isValid: boolean;
    error?: string;
}

export function validateUsername(username: string): UsernameValidation {
    if (username.length < 3) {
        return {
            isValid: false,
            error: 'Username must be at least 3 characters long',
        };
    }

    if (username.length > 30) {
        return {
            isValid: false,
            error: 'Username must be no more than 30 characters long',
        };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            isValid: false,
            error: 'Username can only contain letters, numbers, and underscores',
        };
    }

    return { isValid: true };
}

// Full name validation
export function validateFullName(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= 100;
}

// Bio validation
export function validateBio(bio: string): boolean {
    return bio.length <= 500;
}
