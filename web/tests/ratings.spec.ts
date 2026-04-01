import { test, expect } from '@playwright/test';

const MERCHANT_TOKEN = 'test-ratings-merchant-' + Date.now();
const TRAVELER_TOKEN = 'test-ratings-traveler-' + Date.now();
const CART_NAME = 'Playwright Ratings Cart ' + Date.now();

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

test.describe('Ratings', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Seed cart ─────────────────────────────────────────────────────────────

  test('seed: merchant creates a cart for rating tests', async ({ page }) => {
    await setMerchantSession(page);
    await page.goto('/merchant/new');
    await expect(page.getByRole('button', { name: 'Register Cart' })).toBeVisible();

    await page.getByPlaceholder('e.g. Dragon-Fired Pizza Lair').fill(CART_NAME);
    await page.getByPlaceholder('What makes your stall special?').fill('For ratings tests.');
    await page.locator('select').first().selectOption({ label: 'Dumplings & Wraps' });
    await page.getByPlaceholder('e.g. Dawn to Dusk, Mon–Fri').fill('All day');

    const toggle = page.getByRole('switch');
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await page.locator('select').nth(1).selectOption({ label: 'Aspenlane' });
    await page.getByRole('button', { name: 'Register Cart' }).click();
    await expect(page).toHaveURL('/merchant');
    await expect(page.getByText(CART_NAME)).toBeVisible();
  });

  // ── Traveler rating form ──────────────────────────────────────────────────

  test('traveler sees rating form on cart detail page', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await expect(page.getByText('Ratings & Reviews')).toBeVisible();
    await expect(page.getByText('Leave a rating')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Star rating' })).toBeVisible();
  });

  test('traveler can submit a star rating with review text', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    // Click 4 stars
    await page.getByRole('button', { name: '4 stars' }).click();

    // Type a review
    await page.getByPlaceholder('Share your experience (optional)').fill('Delightful wraps at a fair price!');

    // Submit
    await page.getByRole('button', { name: 'Submit Review' }).click();

    // Form should update to "Update Review"
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });

    // Rating appears in list (scoped to list items, not the textarea)
    await expect(page.getByRole('listitem').filter({ hasText: 'Delightful wraps at a fair price!' })).toBeVisible();
    await expect(page.getByText('(your rating)')).toBeVisible();
  });

  test('aggregate rating appears in header after rating', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    // Should show avg rating (4.0 · 1 rating)
    await expect(page.getByText(/4\.0/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/1 rating/)).toBeVisible();
  });

  test('traveler can update their rating', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    // Existing rating pre-fills the form
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });

    // Change to 5 stars
    await page.getByRole('button', { name: '5 stars' }).click();
    await page.getByRole('button', { name: 'Update Review' }).click();

    // Still shows update button and updated rating
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible({ timeout: 5000 });
  });

  // ── Merchant cannot rate own cart ─────────────────────────────────────────

  test('merchant does not see rating form on own cart', async ({ page }) => {
    await setMerchantSession(page);
    // Navigate directly to traveler view of the cart by switching role via localStorage
    await page.addInitScript((token) => {
      localStorage.setItem('mh_session_token', token);
      localStorage.setItem('mh_role', 'traveler');
    }, MERCHANT_TOKEN);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    // Should see "You operate this stall" message, not the rating form
    await expect(page.getByText('You operate this stall')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Leave a rating')).not.toBeVisible();
  });

  // ── Browse list shows stars ───────────────────────────────────────────────

  test('browse sidebar shows star summary for rated cart', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });

    // The cart entry in the sidebar should show a rating
    const cartEntry = page.locator(`button:has-text("${CART_NAME}")`);
    await expect(cartEntry).toBeVisible();
    // Rating count is shown (e.g. "(1)")
    await expect(cartEntry.getByText(/\(\d+\)/)).toBeVisible();
  });
});
