import { expect, test, type Page } from '@playwright/test';

const emptyCell = (page: Page, nth: number) =>
  page.locator('td.cell:not(.cell--start):not(.cell--end)').nth(nth);

const solve = async (page: Page) => {
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('td.cell--path').first()).toBeVisible({ timeout: 20000 });
};

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
  const cell = emptyCell(page, 20);

  await cell.click();
  await expect(cell).toHaveClass(/cell--wall/);

  await cell.click();
  await expect(cell).not.toHaveClass(/cell--wall/);
});

test('drags a stroke of walls without flickering them back off', async ({ page }) => {
  const from = await emptyCell(page, 200).boundingBox();
  const to = await emptyCell(page, 205).boundingBox();
  if (!from || !to) throw new Error('cells are not laid out');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();

  expect(await page.locator('td.cell--wall').count()).toBeGreaterThan(1);
});

test('runs the search on an empty board and paints a path', async ({ page }) => {
  await solve(page);

  expect(await page.locator('td.cell--visited').count()).toBeGreaterThan(0);
  expect(await page.locator('td.cell--path').count()).toBeGreaterThan(0);
});

test('rewinding the timeline undoes every painted cell', async ({ page }) => {
  await solve(page);
  await expect(page.locator('td.cell--discovered').first()).toBeVisible();

  const slider = page.getByRole('slider', { name: 'Timeline' });
  await slider.fill('0');

  await expect(page.locator('td.cell--visited')).toHaveCount(0);
  await expect(page.locator('td.cell--discovered')).toHaveCount(0);
  await expect(page.locator('td.cell--path')).toHaveCount(0);
});

test('seeking forward and back returns the board to the same state', async ({ page }) => {
  await solve(page);
  const slider = page.getByRole('slider', { name: 'Timeline' });

  await slider.fill('40');
  const visitedAt40 = await page.locator('td.cell--visited').count();

  await slider.fill('120');
  await slider.fill('40');

  expect(await page.locator('td.cell--visited').count()).toBe(visitedAt40);
});

test('reports when the goal is walled off', async ({ page }) => {
  // Fence the end cell in on all four sides.
  const end = page.locator('td.cell--end');
  const x = Number(await end.getAttribute('data-x'));
  const y = Number(await end.getAttribute('data-y'));
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ]) {
    await page.locator(`td[data-x="${x + dx}"][data-y="${y + dy}"]`).click();
  }

  await page.getByRole('button', { name: 'Play' }).click();

  await expect(page.getByRole('status')).toContainText('No path exists', { timeout: 20000 });
});

test('reset grid clears walls', async ({ page }) => {
  const cell = emptyCell(page, 20);
  await cell.click();
  await expect(cell).toHaveClass(/cell--wall/);

  await page.getByRole('button', { name: 'Reset Grid' }).click();

  await expect(page.locator('td.cell--wall')).toHaveCount(0);
});
