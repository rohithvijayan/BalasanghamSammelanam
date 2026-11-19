import { test, expect } from '@playwright/test';

test.describe('Volunteer Helpdesk & Check-In Desk E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login as Volunteer
    await page.getByRole('button', { name: /3\. വളണ്ടിയർ/i }).click();
    await page.getByRole('button', { name: /ലോഗിൻ ചെയ്യുക/i }).click();
    await expect(page).toHaveURL(/\/volunteer/);
  });

  test('Volunteer can view attendance tally, filter list, and toggle check-in', async ({ page }) => {
    // Verify volunteer greeting & tallies
    await expect(page.getByText(/പ്രതിനിധി സ്വീകരണവും ഹാജർ നിലയും/i)).toBeVisible();
    await expect(page.getByText(/ആകെ പ്രതിനിധികൾ/i)).toBeVisible();

    // Search for specific delegate
    const searchInput = page.getByPlaceholder(/പേര്, ഫോൺ നമ്പർ, അല്ലെങ്കിൽ ടോക്കൺ തിരയുക/i);
    await searchInput.fill('ഫാത്തിമ');

    // Verify filtered result
    await expect(page.getByText(/ഫാത്തിമ ഷെറിൻ/i)).toBeVisible();

    // Check-in toggle on the delegate
    const checkinBtn = page.locator('button', { hasText: /ഹാജർ രേഖപ്പെടുത്തുക/i }).first();
    if (await checkinBtn.isVisible()) {
      await checkinBtn.click();
      // Verify success toast appears
      await expect(page.getByText(/ഹാജർ രേഖപ്പെടുത്തി/i)).toBeVisible();
    }
  });

  test('Volunteer can view Host Houses tab with capacities and contacts', async ({ page }) => {
    // Click on Host Houses tab
    const housesTab = page.getByRole('button', { name: /ആതിഥേയ വീടുകൾ/i });
    await housesTab.click();

    // Verify houses are listed with details
    await expect(page.getByText(/പൂന്തോട്ടം വീട്/i)).toBeVisible();
    await expect(page.getByText(/കപ്പാസിറ്റി:/i).first()).toBeVisible();
    await expect(page.getByText(/താമസിക്കുന്ന പ്രതിനിധികൾ/i).first()).toBeVisible();
    await expect(page.getByText(/റൂട്ട് മാപ്പ് കാണുക/i).first()).toBeVisible();
  });
});
