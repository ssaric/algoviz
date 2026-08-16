import { expect, test, type Page } from '@playwright/test';

const boards = (page: Page) => page.locator('.panel');
const settled = async (page: Page) => {
  // Both searches finish and report a verdict.
  await expect(page.locator('.panel__verdict')).toHaveCount(2, { timeout: 30000 });
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('td.cell').first()).toBeVisible();
});

test('opens on the first lesson with two boards running', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('exact heuristic');
  await expect(boards(page)).toHaveCount(2);
  await settled(page);
});

test('shows the measured cost of an optimistic heuristic', async ({ page }) => {
  await settled(page);

  const stats = await page.locator('.panel__stats').allInnerTexts();
  const expanded = stats.map((text) => Number(text.match(/expanded\s+(\d+)/)?.[1]));

  // Manhattan is exact here; Euclidean underestimates and pays for it.
  expect(expanded[0]).toBeGreaterThan(0);
  expect(expanded[1]).toBeGreaterThan(expanded[0] * 8);
  // Both still find a shortest path.
  await expect(page.locator('.panel__verdict')).toHaveText(['shortest path', 'shortest path']);
});

test('navigates between lessons and deep-links them', async ({ page }) => {
  await page.getByRole('button', { name: /Greedy best-first takes the bait/ }).click();

  await expect(page).toHaveURL(/lesson=greedy-takes-the-bait/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Greedy');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Greedy');
});

test('reports when a search returns a path that is not the shortest', async ({ page }) => {
  await page.goto('/?lesson=greedy-takes-the-bait');
  await settled(page);

  const verdicts = await page.locator('.panel__verdict').allInnerTexts();
  expect(verdicts[0]).toBe('shortest path');
  expect(verdicts[1]).toMatch(/cells longer/);
});

test('the two boards stay on one clock', async ({ page }) => {
  await settled(page);

  const scrubber = page.getByRole('slider', { name: 'Timeline' });
  await scrubber.fill('0');
  await expect(page.locator('td.cell--visited')).toHaveCount(0);

  const max = await scrubber.getAttribute('max');
  await scrubber.fill(String(max));
  // The shorter run has finished; the longer one has expanded far more.
  expect(await page.locator('td.cell--path').count()).toBeGreaterThan(0);
});

test('preset boards cannot be drawn on but still explain themselves', async ({ page }) => {
  await settled(page);

  const before = await page.locator('td.cell--wall').count();
  await page.locator('.panel').first().locator('td.cell').nth(5).click();
  expect(await page.locator('td.cell--wall').count()).toBe(before);

  await page.locator('.panel').first().locator('td.cell--visited').nth(2).hover();
  await expect(page.locator('.thoughts')).toBeVisible();
});

test('links through to the sandbox', async ({ page }) => {
  await page.getByRole('link', { name: 'Sandbox' }).click();

  await expect(page).toHaveURL(/\/sandbox/);
  await expect(page.getByLabel('Algorithm')).toBeVisible();
});
