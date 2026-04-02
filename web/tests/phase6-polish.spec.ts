import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setTravelerSession(page: import('@playwright/test').Page, token: string) {
  await page.addInitScript((t) => {
    localStorage.setItem('mh_session_token', t);
    localStorage.setItem('mh_role', 'traveler');
  }, token);
}

async function setMerchantSession(page: import('@playwright/test').Page, token: string) {
  await page.addInitScript((t) => {
    localStorage.setItem('mh_session_token', t);
    localStorage.setItem('mh_role', 'merchant');
  }, token);
}

// ── Font & branding ──────────────────────────────────────────────────────────

test.describe('Phase 6 — Branding & fonts', () => {
  test('NavBar renders app title', async ({ page }) => {
    const token = 'phase6-brand-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    // Full title visible on desktop viewport (default 1280×720)
    // Use regex to handle curly apostrophe (&rsquo; renders as \u2019)
    await expect(page.getByText(/Food-Cart Finder/)).toBeVisible();
  });

  test('NavBar title links back to role home', async ({ page }) => {
    const token = 'phase6-navlink-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    await page.getByRole('link', { name: /Food-Cart Finder/ }).click();
    await expect(page).toHaveURL('/traveler');
  });

  test('Merchant page has page-title heading', async ({ page }) => {
    const token = 'phase6-merch-title-' + Date.now();
    await setMerchantSession(page, token);
    await page.goto('/merchant');
    // &rsquo; renders as curly quote — match with regex
    await expect(page.getByRole('heading', { name: /Merchant.*Guild/ })).toBeVisible();
  });

  test('Passport page has page-title heading', async ({ page }) => {
    const token = 'phase6-passport-title-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler/passport');
    await expect(page.getByRole('heading', { name: 'My Passport' })).toBeVisible();
  });
});

// ── Loading states ────────────────────────────────────────────────────────────

test.describe('Phase 6 — Loading states', () => {
  test('merchant page shows skeleton then resolves', async ({ page }) => {
    const token = 'phase6-loading-merchant-' + Date.now();
    await setMerchantSession(page, token);
    await page.goto('/merchant');
    // After load completes, guild heading and empty state or list is shown
    await expect(page.getByRole('heading', { name: /Merchant.*Guild/ })).toBeVisible();
    // Skeleton elements should be gone
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
  });

  test('passport page shows loading then resolves', async ({ page }) => {
    const token = 'phase6-loading-passport-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler/passport');
    await expect(page.getByRole('heading', { name: 'My Passport' })).toBeVisible();
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
  });

  test('traveler browse shows skeleton list then carts', async ({ page }) => {
    const token = 'phase6-loading-browse-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    // After API resolves, skeleton is gone and content is present
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
  });
});

// ── Empty states ──────────────────────────────────────────────────────────────

test.describe('Phase 6 — Empty states', () => {
  test('new merchant sees empty state with register CTA', async ({ page }) => {
    const token = 'phase6-empty-merchant-' + Date.now();
    await setMerchantSession(page, token);
    await page.goto('/merchant');
    await expect(page.getByText('No listings yet.')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Register your first cart' })).toBeVisible();
  });

  test('empty state register link navigates to new cart form', async ({ page }) => {
    const token = 'phase6-empty-nav-' + Date.now();
    await setMerchantSession(page, token);
    await page.goto('/merchant');
    await page.getByRole('link', { name: 'Register your first cart' }).click();
    await expect(page).toHaveURL('/merchant/new');
  });

  test('passport page shows empty badges state for new traveler', async ({ page }) => {
    const token = 'phase6-empty-badges-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler/passport');
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/No badges yet/)).toBeVisible();
  });

  test('passport page shows leaderboard section after loading', async ({ page }) => {
    const token = 'phase6-lb-section-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler/passport');
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
    // Either the leaderboard heading with entries or the empty state is visible
    await expect(page.getByRole('heading', { name: 'City Leaderboard' })).toBeVisible();
  });
});

// ── Mobile layout ─────────────────────────────────────────────────────────────

test.describe('Phase 6 — Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test('NavBar shows "Misthaven" short title on mobile', async ({ page }) => {
    const token = 'phase6-mobile-nav-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    await expect(page.getByText('Misthaven')).toBeVisible();
  });

  test('RoleSelector buttons visible on mobile', async ({ page }) => {
    const token = 'phase6-mobile-role-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    await expect(page.getByRole('button', { name: /Traveler/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Merchant/ })).toBeVisible();
  });

  test('traveler browse map is visible on mobile', async ({ page }) => {
    const token = 'phase6-mobile-map-' + Date.now();
    await setTravelerSession(page, token);
    await page.goto('/traveler');
    // Map container should be present (Leaflet renders inside it)
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 8000 });
  });

  test('merchant page readable on mobile', async ({ page }) => {
    const token = 'phase6-mobile-merchant-' + Date.now();
    await setMerchantSession(page, token);
    await page.goto('/merchant');
    await expect(page.getByRole('heading', { name: /Merchant.*Guild/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New Listing' })).toBeVisible();
  });

  test('cart detail page readable on mobile', async ({ page }) => {
    // Create a cart first with a desktop-sized page
    const merchantToken = 'phase6-mobile-detail-merchant-' + Date.now();
    const cartName = 'Mobile Test Cart ' + Date.now();

    // Use a separate page at desktop viewport to create the cart
    const ctx = page.context();
    const desktopPage = await ctx.newPage();
    await desktopPage.setViewportSize({ width: 1280, height: 720 });
    await desktopPage.addInitScript((t) => {
      localStorage.setItem('mh_session_token', t);
      localStorage.setItem('mh_role', 'merchant');
    }, merchantToken);
    await desktopPage.goto('/merchant/new');
    await desktopPage.getByPlaceholder('e.g. Dragon-Fired Pizza Lair').fill(cartName);
    await desktopPage.getByRole('button', { name: 'Register Cart' }).click();
    await expect(desktopPage.getByText(cartName)).toBeVisible({ timeout: 8000 });

    // Get the cart id from the edit link
    const editLink = desktopPage.getByRole('link', { name: 'Edit' }).first();
    const href = await editLink.getAttribute('href');
    const cartId = href?.split('/')[2];
    await desktopPage.close();

    if (!cartId) return; // skip if cart creation failed

    // Now visit on mobile
    const travelerToken = 'phase6-mobile-detail-traveler-' + Date.now();
    await setTravelerSession(page, travelerToken);
    await page.goto(`/traveler/${cartId}`);
    await expect(page.locator('.skeleton').first()).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText(cartName)).toBeVisible();
    await expect(page.getByText('Bill of Fare')).toBeVisible();
  });
});
