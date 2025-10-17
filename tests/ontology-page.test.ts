import { test, expect } from '@playwright/test';

test.describe('Ontology Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ontology page
    await page.goto('http://localhost:3000/ontology');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display single Ontology header without duplication', async ({ page }) => {
    // Verify h1 heading exists
    const h1 = page.locator('h1:has-text("Ontology")');
    await expect(h1).toBeVisible();

    // Verify description text is present
    const description = page.locator('text=Your personal beliefs, values, and goals');
    await expect(description).toBeVisible();

    // Verify "Personal Ontology" text does NOT appear as a separate heading
    const personalOntologyHeading = page.locator('h2:has-text("Personal Ontology")');
    await expect(personalOntologyHeading).not.toBeVisible();

    // Count total number of h1 tags on page - should only be one
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('should maintain proper heading hierarchy', async ({ page }) => {
    // Verify main heading is h1
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toHaveText('Ontology');

    // Verify no duplicate h1 tags
    const allH1s = await page.locator('h1').all();
    expect(allH1s.length).toBe(1);
  });

  test('should display Ontology Analysis button', async ({ page }) => {
    // Verify the analysis button is present
    const analysisButton = page.locator('button:has-text("Analyze")');
    await expect(analysisButton).toBeVisible();
  });

  test('should display correctly in both light and dark themes', async ({ page }) => {
    // Test light mode
    const h1Light = page.locator('h1:has-text("Ontology")');
    await expect(h1Light).toBeVisible();

    // Switch to dark mode (if theme toggle is available)
    const themeToggle = page.locator('[aria-label*="theme"], button:has-text("Theme")');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();

      // Verify heading still visible in dark mode
      const h1Dark = page.locator('h1:has-text("Ontology")');
      await expect(h1Dark).toBeVisible();
    }
  });
});
