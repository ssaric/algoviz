import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Painter builds the board on mount, sized from the viewport.
  await expect(page.locator('td.cell').first()).toBeVisible();
});

test('renders the board with a start and an end cell', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Algoviz' })).toBeVisible();
  expect(await page.locator('td.cell').count()).toBeGreaterThan(100);
  await expect(page.locator('td.cell--start')).toHaveCount(1);
  await expect(page.locator('td.cell--end')).toHaveCount(1);
});

test('toggles a wall when a cell is clicked', async ({ page }) => {
  const cell = page.locator('td.cell:not(.cell--start):not(.cell--end)').nth(20);

  await cell.click();
  await expect(cell).toHaveClass(/cell--wall/);

  await cell.click();
  await expect(cell).not.toHaveClass(/cell--wall/);
});

test('play runs the search and paints a path to the goal', async ({ page }) => {
  // isGridValid() requires at least one wall before the search will start.
  await page.locator('td.cell:not(.cell--start):not(.cell--end)').nth(20).click();

  await page.getByRole('button', { name: 'Play' }).click();

  await expect(page.locator('td.cell--visited').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('td.cell--path').first()).toBeVisible({ timeout: 15000 });
});

test('reset grid clears walls', async ({ page }) => {
  const cell = page.locator('td.cell:not(.cell--start):not(.cell--end)').nth(20);
  await cell.click();
  await expect(cell).toHaveClass(/cell--wall/);

  await page.getByRole('button', { name: 'Reset Grid' }).click();

  await expect(page.locator('td.cell--wall')).toHaveCount(0);
});
