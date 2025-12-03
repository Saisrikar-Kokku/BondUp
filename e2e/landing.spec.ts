import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should display the hero section', async ({ page }) => {
        await page.goto('/');

        // Check for main heading
        await expect(page.getByRole('heading', { name: /Connect with/i })).toBeVisible();

        // Check for CTA buttons
        await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Explore Features/i })).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: /Sign Up/i }).first().click();

        // Should redirect to signup page
        await expect(page).toHaveURL('/signup');
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: /Log In/i }).click();

        // Should redirect to login page
        await expect(page).toHaveURL('/login');
    });
});
