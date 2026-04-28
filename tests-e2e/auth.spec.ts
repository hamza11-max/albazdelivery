import { test, expect } from '@playwright/test'

/**
 * Matches `app/login/page.tsx` (FR copy: labels and button).
 * `baseURL` comes from `playwright.config.ts`.
 */
test.describe.configure({ mode: 'serial' })
test.describe('Authentication', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Se connecter' })
    ).toBeVisible()
  })

  test('should not submit with empty required fields (HTML5 validation)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.locator('#identifier')).toHaveJSProperty(
      'validity.valueMissing',
      true
    )
    await expect(page.locator('#password')).toHaveJSProperty(
      'validity.valueMissing',
      true
    )
  })

  test('should show error for invalid credentials', async ({ page }) => {
    /** NextAuth v5 client parses `error` from `data.url` query string — raw 401 breaks `new URL(data.url)` and hits catch(). */
    await page.route('**/api/auth/callback/credentials**', async (route) => {
      const origin = new URL(route.request().url()).origin
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: `${origin}/api/auth/signin?error=CredentialsSignin`,
        }),
      })
    })

    await page.getByLabel('Email').fill('invalid@example.com')
    await page.getByLabel('Mot de passe').fill('wrongpassword')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(
      page.getByText('Email ou mot de passe incorrect')
    ).toBeVisible()
  })
})
