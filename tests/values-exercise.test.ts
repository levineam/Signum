import { test, expect } from '@playwright/test';

test.describe('Values Exercise', () => {
  test('completes the values flow and handles discard', async ({ page }) => {
    await page.goto('/ontology');
    await page.waitForLoadState('networkidle');

    const discoverButton = page.getByRole('button', { name: 'Discover your values' });
    await expect(discoverButton).toBeVisible();
    await discoverButton.click();

    const modalTitle = page.getByRole('heading', { name: 'Discover your values' });
    await expect(modalTitle).toBeVisible();

    // Make a selection, then discard to verify confirmation dialog
    await page.getByRole('button', { name: 'Curiosity' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    const discardDialog = page.getByRole('heading', { name: 'Discard this exercise?' });
    await expect(discardDialog).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(modalTitle).toBeHidden();

    // Restart and complete
    await discoverButton.click();
    await expect(modalTitle).toBeVisible();

    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeDisabled();

    const selections = [
      'Curiosity',
      'Growth',
      'Wisdom',
      'Creativity',
      'Integrity',
      'Compassion',
      'Justice',
      'Purpose'
    ];

    for (const name of selections) {
      await page.getByRole('button', { name }).click();
    }

    await expect(nextButton).toBeEnabled();
    await expect(page.getByText('8/8 selected')).toBeVisible();

    // Attempt to select beyond max and ensure count does not change
    await page.getByRole('button', { name: 'Gratitude' }).click();
    await expect(page.getByText('8/8 selected')).toBeVisible();

    await nextButton.click();

    const list = page.getByRole('list');
    await expect(list).toBeVisible();
    const listItems = list.getByRole('listitem');
    await expect(listItems).toHaveCount(8);

    // Reorder using accessibility buttons
    await page.getByRole('button', { name: 'Move Curiosity down' }).click();
    await expect(listItems.nth(1)).toContainText('Curiosity');

    const completeButton = page.getByRole('button', { name: 'Complete' });
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    await expect(modalTitle).toBeHidden();
    await expect(page.getByText('Curiosity')).toBeVisible();
  });
});
