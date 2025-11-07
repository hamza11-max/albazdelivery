import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('http://localhost:3000/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if the login form is visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    // Try to submit the form without filling any fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for validation errors
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock the API response for invalid credentials
    await page.route('**/api/auth/callback/credentials*', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    // Fill in the form with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});
