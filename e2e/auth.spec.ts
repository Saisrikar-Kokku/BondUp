import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;
    const testPassword = 'TestPassword123';

    test('should complete signup flow', async ({ page }) => {
        await page.goto('/signup');

        // Fill out signup form
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="username"]', testUsername);
        await page.fill('input[name="fullName"]', 'Test User');
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to verify email page
        await expect(page).toHaveURL('/verify-email');
        await expect(page.getByText(/check your email/i)).toBeVisible();
    });

    test('should show validation errors for invalid signup', async ({ page }) => {
        await page.goto('/signup');

        // Try to submit with invalid data
        await page.fill('input[name="email"]', 'invalid-email');
        await page.fill('input[name="username"]', 'ab'); // Too short
        await page.fill('input[name="password"]', '123'); // Too weak
        await page.click('button[type="submit"]');

        // Should show validation errors
        await expect(page.getByText(/valid email/i)).toBeVisible();
        await expect(page.getByText(/at least 3 characters/i)).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/signup');

        await page.click('text=Log in');

        await expect(page).toHaveURL('/login');
    });

    test('should display login form', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });
});

test.describe('Profile Pages', () => {
    test('should redirect to login when accessing edit profile without auth', async ({ page }) => {
        await page.goto('/profile/edit');

        // Should redirect to login
        await expect(page).toHaveURL('/login');
    });

    test('should display landing page elements', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText(/SocialNest/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    });
});
