import { test, expect } from '@playwright/test';

test.describe('Role-Based Authentication & Permissions E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage for a fresh session
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Public Landing Page displays login button and no admin leaks', async ({ page }) => {
    await page.goto('/');

    // Verify page title & branding
    await expect(page).toHaveTitle(/ബാലസംഘം സംസ്ഥാന സമ്മേളനം/i);

    // Verify Login button exists in header and on the landing card
    const headerLoginBtn = page.locator('header a[href="/login"]');
    await expect(headerLoginBtn).toBeVisible();

    const landingLoginCard = page.getByText(/സംഘാടകരും വളണ്ടിയർമാരുമാണോ\?/i);
    await expect(landingLoginCard).toBeVisible();

    // Verify no admin links are exposed on public landing page
    await expect(page.locator('header').getByText(/അഡ്മിൻ വർക്ക് ബെഞ്ച്/i)).not.toBeVisible();
    await expect(page.locator('header').getByText(/ഡാറ്റ ഇമ്പോർട്ട്/i)).not.toBeVisible();
  });

  test('Volunteer login unlocks Volunteer Desk and denies /import', async ({ page }) => {
    await page.goto('/login');

    // Fill Volunteer credentials
    await page.getByPlaceholder(/staff@balasangham.in/i).fill('volunteer@balasangham.in');
    await page.getByPlaceholder(/••••••••/i).fill('volunteer123');

    // Sign In
    await page.getByRole('button', { name: /ലോഗിൻ ചെയ്യുക/i }).click();

    // Should automatically navigate to /volunteer
    await expect(page).toHaveURL(/\/volunteer/);
    await expect(page.locator('header').getByText('volunteer@balasangham.in')).toBeVisible();
    await expect(page.getByText(/വളണ്ടിയർ ഹെൽപ്പ് ഡെസ്ക്/i)).toBeVisible();
    await expect(page.getByText(/രേഷ്മ പി\./i)).toBeVisible();

    // Attempting to visit /import should show Access Denied
    await page.goto('/import');
    await expect(page.getByText(/അനുമതിയില്ല \(Access Denied\)/i)).toBeVisible();
  });

  test('District Coordinator login scopes workbench strictly to Kannur', async ({ page }) => {
    await page.goto('/login');

    // Fill District Coordinator credentials
    await page.getByPlaceholder(/staff@balasangham.in/i).fill('kannur@balasangham.in');
    await page.getByPlaceholder(/••••••••/i).fill('kannur123');

    // Sign In
    await page.getByRole('button', { name: /ലോഗിൻ ചെയ്യുക/i }).click();

    // Should navigate to /admin
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('header').getByText('kannur@balasangham.in')).toBeVisible();
    await expect(page.getByText(/കണ്ണൂർ കോർഡിനേഷൻ പാനൽ/i)).toBeVisible();
    await expect(page.getByText(/കണ്ണൂർ \(ലോക്ക് ചെയ്തത്\)/i)).toBeVisible();

    // Verify header does not include CSV import
    await expect(page.locator('header').getByText(/ഡാറ്റ ഇമ്പോർട്ട് \(CSV\)/i)).not.toBeVisible();
  });

  test('State Admin login unlocks full system with all districts and CSV import', async ({ page }) => {
    await page.goto('/login');

    // Fill State Admin credentials
    await page.getByPlaceholder(/staff@balasangham.in/i).fill('admin@balasangham.in');
    await page.getByPlaceholder(/••••••••/i).fill('admin123');

    // Sign In
    await page.getByRole('button', { name: /ലോഗിൻ ചെയ്യുക/i }).click();

    // Should navigate to /admin with full selector
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('header').getByText('admin@balasangham.in')).toBeVisible();
    await expect(page.getByText(/സംസ്ഥാന അഡ്മിൻ വർക്ക് ബെഞ്ച്/i)).toBeVisible();

    // District dropdown should contain all 14 districts
    const districtSelect = page.locator('select');
    await expect(districtSelect).toBeVisible();
    await expect(districtSelect).toContainText('എല്ലാ ജില്ലകളും');

    // Click Import CSV from header
    const importLink = page.locator('header a[href="/import"]');
    await expect(importLink).toBeVisible();
    await importLink.click();

    await expect(page).toHaveURL(/\/import/);
    await expect(page.getByText(/ഡാറ്റ ഇമ്പോർട്ട്/i)).toBeVisible();
  });
});
