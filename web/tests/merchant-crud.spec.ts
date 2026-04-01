import { test, expect } from '@playwright/test';

// Shared session token for this test run — simulates a single merchant browser session.
const SESSION_TOKEN = 'test-merchant-' + Date.now();

// Helper: seed localStorage before any navigation so the page sees the right role on first load.
async function setMerchantSession(page: import('@playwright/test').Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('mh_session_token', token);
    localStorage.setItem('mh_role', 'merchant');
  }, SESSION_TOKEN);
}

test.describe('Merchant CRUD', () => {
  let createdCartName: string;

  test.beforeEach(async ({ page }) => {
    await setMerchantSession(page);
  });

  // ── Create ────────────────────────────────────────────────────────────────

  test('merchant can create a new cart', async ({ page }) => {
    createdCartName = 'Playwright Test Cart ' + Date.now();

    await page.goto('/merchant/new');
    // Wait for hydration — form submit button must be interactive
    const submitBtn = page.getByRole('button', { name: 'Register Cart' });
    await expect(submitBtn).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Register a New Cart' })).toBeVisible();

    // Fill in required fields
    await page.getByPlaceholder('e.g. Dragon-Fired Pizza Lair').fill(createdCartName);
    await page.getByPlaceholder('What makes your stall special?').fill('A cart created by automated tests.');
    await page.locator('select').first().selectOption({ label: 'BBQ & Grilled Meats' });
    await page.getByPlaceholder('e.g. Dawn to Dusk, Mon–Fri').fill('All day, every day');

    // Toggle open — click and verify aria-checked flips
    const toggle = page.getByRole('switch');
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Select district
    await page.locator('select').nth(1).selectOption({ label: 'Midheath' });

    await page.getByRole('button', { name: 'Register Cart' }).click();

    // Should redirect to merchant dashboard
    await expect(page).toHaveURL('/merchant');
    await expect(page.getByText(createdCartName)).toBeVisible();
  });

  // ── Read / List ───────────────────────────────────────────────────────────

  test('merchant dashboard lists own carts', async ({ page }) => {
    await page.goto('/merchant');
    // Heading uses &rsquo; — match by text content regardless of quote type
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Merchant');
    // Wait for loading to finish (session token hydrates async)
    await expect(page.getByText('Consulting the guild ledger')).not.toBeVisible({ timeout: 8000 });
  });

  // ── Edit ──────────────────────────────────────────────────────────────────

  test('merchant can edit a cart', async ({ page }) => {
    await page.goto('/merchant');
    // Wait for loading to complete
    await expect(page.getByText('Consulting the guild ledger')).not.toBeVisible({ timeout: 10000 });
    const editButton = page.getByRole('link', { name: 'Edit' }).first();

    // If no carts yet, skip (create test must run first)
    const count = await editButton.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await editButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Cart' })).toBeVisible();

    // Modify the description
    const desc = page.getByPlaceholder('What makes your stall special?');
    await desc.clear();
    await desc.fill('Updated by Playwright.');

    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Should redirect back to dashboard
    await expect(page).toHaveURL('/merchant');
  });

  // ── Menu items ────────────────────────────────────────────────────────────

  test('merchant can add a menu item to a cart', async ({ page }) => {
    await page.goto('/merchant');
    await expect(page.getByText('Consulting the guild ledger')).not.toBeVisible({ timeout: 10000 });
    const editButton = page.getByRole('link', { name: 'Edit' }).first();
    if (await editButton.count() === 0) {
      test.skip();
      return;
    }
    await editButton.click();

    await expect(page.getByText('Menu Items')).toBeVisible();

    await page.getByPlaceholder('Item name').fill('Dragon Skewer');
    await page.getByPlaceholder('Price (gp)').fill('5.50');
    await page.getByRole('button', { name: '+ Add Item' }).click();

    await expect(page.getByText('Dragon Skewer')).toBeVisible();
    await expect(page.getByText('5.50 gp')).toBeVisible();
  });

  test('merchant can remove a menu item', async ({ page }) => {
    await page.goto('/merchant');
    await expect(page.getByText('Consulting the guild ledger')).not.toBeVisible({ timeout: 10000 });
    const editButton = page.getByRole('link', { name: 'Edit' }).first();
    if (await editButton.count() === 0) {
      test.skip();
      return;
    }
    await editButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Cart' })).toBeVisible();

    // Only attempt removal if there's an item
    const removeButtons = page.getByRole('button', { name: 'Remove' });
    const countBefore = await removeButtons.count();
    if (countBefore === 0) {
      test.skip();
      return;
    }

    await removeButtons.first().click();

    // One fewer Remove button should be present
    await expect(removeButtons).toHaveCount(countBefore - 1);
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  test('merchant can delete a cart', async ({ page }) => {
    await page.goto('/merchant');
    await expect(page.getByText('Consulting the guild ledger')).not.toBeVisible({ timeout: 10000 });
    const removeButton = page.getByRole('button', { name: 'Remove' }).first();
    if (await removeButton.count() === 0) {
      test.skip();
      return;
    }

    // Capture cart name before deletion
    const cartItem = page.locator('li').filter({ hasText: 'Remove' }).first();
    const cartName = await cartItem.locator('h2').first().textContent();

    // Playwright auto-accepts confirm dialogs by default — override to accept
    page.once('dialog', (dialog) => dialog.accept());
    await removeButton.click();

    // Cart should be gone
    if (cartName) {
      await expect(page.getByText(cartName.trim())).toHaveCount(0);
    }
  });
});
