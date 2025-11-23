import { test, expect } from '@playwright/test';

test.describe('Ontology Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ontology page
    await page.goto('/ontology');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display Ontology Analysis button', async ({ page }) => {
    // Verify the analysis button is present
    const analysisButton = page.locator('button:has-text("Analyze")');
    await expect(analysisButton).toBeVisible();
  });

  test('should display ontology cards container', async ({ page }) => {
    // Verify the Analyze button section exists
    const controls = page.getByTestId('ontology-controls');
    await expect(controls).toBeVisible();

    // Verify the ontology cards container exists
    const cards = page.getByTestId('ontology-cards');
    await expect(cards).toBeAttached();
  });

  test('should display correctly in both light and dark themes', async ({ page }) => {
    // Test light mode - verify Analyze button is visible
    const analysisButton = page.locator('button:has-text("Analyze")');
    await expect(analysisButton).toBeVisible();

    // Switch to dark mode (if theme toggle is available)
    const themeToggle = page.locator('[aria-label*="theme"], button:has-text("Theme")');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();

      // Verify button still visible in dark mode
      await expect(analysisButton).toBeVisible();
    }
  });
});
