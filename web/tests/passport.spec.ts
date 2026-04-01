import { test, expect } from '@playwright/test';

const MERCHANT_TOKEN = 'test-passport-merchant-' + Date.now();
const TRAVELER_TOKEN = 'test-passport-traveler-' + Date.now();
const CART_NAME = 'Playwright Passport Cart ' + Date.now();

async function setTravelerSession(page: import('@playwright/test').Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('mh_session_token', token);
    localStorage.setItem('mh_role', 'traveler');
  }, TRAVELER_TOKEN);
}

async function setMerchantSession(page: import('@playwright/test').Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('mh_session_token', token);
    localStorage.setItem('mh_role', 'merchant');
  }, MERCHANT_TOKEN);
}

test.describe('Passport & Leaderboard', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Seed cart ─────────────────────────────────────────────────────────────

  test('seed: merchant creates a cart for passport tests', async ({ page }) => {
    await setMerchantSession(page);
    await page.goto('/merchant/new');
    await expect(page.getByRole('button', { name: 'Register Cart' })).toBeVisible();

    await page.getByPlaceholder('e.g. Dragon-Fired Pizza Lair').fill(CART_NAME);
    await page.getByPlaceholder('What makes your stall special?').fill('For passport tests.');
    await page.locator('select').first().selectOption({ label: 'Street Skewers' });
    await page.getByPlaceholder('e.g. Dawn to Dusk, Mon–Fri').fill('All day');

    const toggle = page.getByRole('switch');
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await page.locator('select').nth(1).selectOption({ label: 'Midheath' });
    await page.getByRole('button', { name: 'Register Cart' }).click();
    await expect(page).toHaveURL('/merchant');
    await expect(page.getByText(CART_NAME)).toBeVisible();
  });

  // ── Empty passport ────────────────────────────────────────────────────────

  test('passport page shows 0 stamps for a new traveler', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler/passport');
    await expect(page.getByText('My Passport')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.text-5xl')).toHaveText('0', { timeout: 8000 });
    await expect(page.getByText('No badges yet')).toBeVisible({ timeout: 8000 });
  });

  // ── Nav link ──────────────────────────────────────────────────────────────

  test('My Passport nav link is visible for travelers', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByRole('link', { name: 'My Passport' })).toBeVisible({ timeout: 8000 });
  });

  test('My Passport nav link is not visible for merchants', async ({ page }) => {
    await setMerchantSession(page);
    await page.goto('/merchant');
    await expect(page.getByRole('link', { name: 'My Passport' })).not.toBeVisible();
  });

  // ── Stamp earned after rating ─────────────────────────────────────────────

  test('stamp is issued after traveler rates a cart', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await page.getByRole('button', { name: '3 stars' }).click();
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });

    // Visit passport — should now show 1 stamp
    await page.goto('/traveler/passport');
    await expect(page.getByText('My Passport')).toBeVisible({ timeout: 8000 });
    // The big stamp count number uses text-5xl class
    await expect(page.locator('.text-5xl')).toHaveText('1', { timeout: 8000 });
    await expect(page.getByText(CART_NAME)).toBeVisible();
  });

  // ── First Bite badge ──────────────────────────────────────────────────────

  test('First Bite badge is awarded after first stamp', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler/passport');
    await expect(page.getByText('My Passport')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('First Bite')).toBeVisible({ timeout: 8000 });
  });

  // ── Re-rating doesn't add a second stamp ─────────────────────────────────

  test('updating a rating does not add a duplicate stamp', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '5 stars' }).click();
    await page.getByRole('button', { name: 'Update Review' }).click();
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });

    await page.goto('/traveler/passport');
    await expect(page.getByText('My Passport')).toBeVisible({ timeout: 8000 });
    // Still only 1 stamp
    await expect(page.locator('.text-5xl')).toHaveText('1', { timeout: 8000 });
  });

  // ── Leaderboard ───────────────────────────────────────────────────────────

  test('leaderboard appears and includes the traveler', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler/passport');
    await expect(page.getByText('City Leaderboard')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('(you)')).toBeVisible();
  });
});
