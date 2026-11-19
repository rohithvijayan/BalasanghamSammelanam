import { test, expect } from '@playwright/test';

test.describe('Admin Workbench & Housing Allotment E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login as State Admin
    await page.getByRole('button', { name: /1\. അഡ്മിൻ/i }).click();
    await page.getByRole('button', { name: /ലോഗിൻ ചെയ്യുക/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Admin can view conference metrics and filter by district', async ({ page }) => {
    // Verify top metrics row
    await expect(page.getByText(/ആകെ പ്രതിനിധികൾ/i)).toBeVisible();
    await expect(page.getByText(/താമസസ്ഥലം അനുവദിച്ചവർ/i)).toBeVisible();

    // Select Kasaragod district from dropdown
    const select = page.locator('select');
    await select.selectOption({ label: 'കാസർഗോഡ്' });

    // Verify district filter updates
    await expect(select).toHaveValue('1');
  });

  test('Admin can view housing capacity cards and assigned residents', async ({ page }) => {
    // Verify Host Houses header
    await expect(page.getByText(/താമസ കേന്ദ്രങ്ങൾ & കപ്പാസിറ്റി/i)).toBeVisible();

    // Verify houses exist
    await expect(page.getByText(/പൂന്തോട്ടം വീട്/i)).toBeVisible();
    await expect(page.getByText(/സൗപർണിക/i)).toBeVisible();
  });
});
