import { test, expect } from '@playwright/test';

test.describe('Delegate Stay Portal E2E', () => {
  test('Search delegate token from home hero and view stay portal', async ({ page }) => {
    await page.goto('/');

    // Type delegate token in search bar
    const searchInput = page.getByPlaceholder(/ഡെലിഗേറ്റ് ഐഡിയോ ഫോൺ നമ്പറോ നൽകുക/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('kannur-arjun-412');

    // Click search button
    await page.getByRole('button', { name: /തിരയുക/i }).click();

    // Verifies navigation to /d/kannur-arjun-412
    await expect(page).toHaveURL(/\/d\/kannur-arjun-412/);

    // Verify Delegate Name and Status
    await expect(page.getByText(/അർജുൻ കെ\./i)).toBeVisible();

    // Verify Accommodation Host Card
    await expect(page.getByText(/പൂന്തോട്ടം വീട്/i)).toBeVisible();
    await expect(page.getByText(/കെ\. രാഘവൻ/i)).toBeVisible();
    await expect(page.locator('a[href^="tel:+91 94471 23456"]')).toBeVisible();

    // Verify Google Maps Route Link
    const mapLink = page.getByText(/റൂട്ട് മാപ്പ് കാണുക/i);
    await expect(mapLink).toBeVisible();

    // Verify Volunteer Card
    await expect(page.getByText(/രേഷ്മ പി\./i)).toBeVisible();

    // Verify Live Announcements
    await expect(page.getByText(/സാംസ്കാരിക സമ്മേളനം/i).first()).toBeVisible();
  });

  test('Language switcher toggles whole portal between Malayalam and English', async ({ page }) => {
    await page.goto('/d/kannur-arjun-412');

    // Currently Malayalam by default
    await expect(page.getByText('മലയാളം')).toBeVisible();

    // Switch to English
    await page.getByRole('button', { name: 'English' }).click();

    // Check English translations render
    await expect(page.getByText(/Accommodation Details/i)).toBeVisible();
    await expect(page.getByText(/Open in Google Maps/i)).toBeVisible();
    await expect(page.getByText(/Volunteer Support/i)).toBeVisible();

    // Switch back to Malayalam
    await page.getByRole('button', { name: 'മലയാളം' }).click();
    await expect(page.getByText(/താമസ സൗകര്യം/i)).toBeVisible();
  });

  test('Invalid delegate token shows supportive error message', async ({ page }) => {
    await page.goto('/d/invalid-token-xyz-999');

    // Verify friendly error message
    await expect(page.getByText(/ഈ ലിങ്ക് അസാധുവാണ്/i)).toBeVisible();
    await expect(page.getByText(/ഹെൽപ്പ് ഡെസ്കുമായി ബന്ധപ്പെടുക/i)).toBeVisible();
  });
});
