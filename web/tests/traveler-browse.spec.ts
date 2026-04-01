import { test, expect } from '@playwright/test';

const MERCHANT_TOKEN = 'test-traveler-browse-merchant-' + Date.now();
const TRAVELER_TOKEN = 'test-traveler-' + Date.now();
const CART_NAME = 'Playwright Browse Cart ' + Date.now();

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

// ── Seed: create a cart so the traveler has something to browse ───────────────

test.describe('Traveler Browse', () => {
  test.describe.configure({ mode: 'serial' });

  test('seed: merchant creates a cart for traveler tests', async ({ page }) => {
    await setMerchantSession(page);
    await page.goto('/merchant/new');
    await expect(page.getByRole('button', { name: 'Register Cart' })).toBeVisible();

    await page.getByPlaceholder('e.g. Dragon-Fired Pizza Lair').fill(CART_NAME);
    await page.getByPlaceholder('What makes your stall special?').fill('For traveler browse tests.');
    await page.locator('select').first().selectOption({ label: 'BBQ & Grilled Meats' });
    await page.getByPlaceholder('e.g. Dawn to Dusk, Mon–Fri').fill('All day');

    // Toggle open
    const toggle = page.getByRole('switch');
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await page.locator('select').nth(1).selectOption({ label: 'Midheath' });
    await page.getByRole('button', { name: 'Register Cart' }).click();
    await expect(page).toHaveURL('/merchant');
    await expect(page.getByText(CART_NAME)).toBeVisible();
  });

  // ── Traveler page loads ───────────────────────────────────────────────────

  test('traveler page shows the map and stall list', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');

    // Filter bar visible (district select + open checkbox)
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByLabel('Open now')).toBeVisible();

    // Sidebar heading
    await expect(page.getByText('Stalls & Carts')).toBeVisible();
  });

  test('traveler can see the seeded cart in the list', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');

    // Wait for carts to load (the seeded cart should appear)
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
  });

  // ── Filters ───────────────────────────────────────────────────────────────

  test('district filter reduces visible carts', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });

    // Filter to a district unlikely to match our cart (Beerside)
    await page.locator('select').selectOption('Beerside');

    // Stall count changes — CART_NAME should not appear (it's in Midheath)
    await expect(page.getByText(CART_NAME)).not.toBeVisible({ timeout: 5000 });

    // Switch back to Midheath — cart should re-appear
    await page.locator('select').selectOption('Midheath');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 5000 });
  });

  test('open-now filter shows only open carts', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });

    // Toggle "Open now" — seeded cart is open, so it should remain visible
    await page.getByLabel('Open now').check();
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 5000 });

    // Clear filters link appears
    await expect(page.getByText('Clear filters')).toBeVisible();
    await page.getByText('Clear filters').click();

    // Filter cleared — open checkbox unchecked
    await expect(page.getByLabel('Open now')).not.toBeChecked();
  });

  // ── Cart detail page ──────────────────────────────────────────────────────

  test('traveler can navigate to cart detail page', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });

    // Click the cart in the sidebar list
    await page.getByText(CART_NAME).click();

    // Should land on detail page
    await expect(page).toHaveURL(/\/traveler\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(CART_NAME);
  });

  test('cart detail page shows open status and back link', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    // The open status badge is a span with exact text "Open"
    await expect(page.locator('span').filter({ hasText: /^Open$/ })).toBeVisible();
    await expect(page.getByText('← Back to map')).toBeVisible();
  });

  test('back link returns to traveler map', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await page.getByText('← Back to map').click();
    await expect(page).toHaveURL('/traveler');
  });

  test('cart detail page shows cuisine type', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(CART_NAME);
    await expect(page.getByText('BBQ & Grilled Meats')).toBeVisible();
  });

  test('cart detail page shows bill of fare section', async ({ page }) => {
    await setTravelerSession(page);
    await page.goto('/traveler');
    await expect(page.getByText(CART_NAME)).toBeVisible({ timeout: 8000 });
    await page.getByText(CART_NAME).click();
    await expect(page).toHaveURL(/\/traveler\/.+/);

    await expect(page.getByText('Bill of Fare')).toBeVisible();
  });
});
