import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/reference');
  await expect(page.locator('td.cell').first()).toBeVisible();
});

test('the nav links through to the reference section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Reference' }).click();
  await expect(page).toHaveURL(/\/reference/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A*');
});

test('lists all four algorithm/heuristic pages, defaulting to A*', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Algorithms' });
  await expect(nav.getByRole('button')).toHaveCount(4);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    "A*: balancing what you've spent"
  );
});

test('switching pages via the sidebar updates the article and deep-links it', async ({ page }) => {
  await page.getByRole('button', { name: /Euclidean/ }).click();
  await expect(page).toHaveURL(/page=euclidean/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Euclidean');
});

test('typesets its maths', async ({ page }) => {
  await expect(page.locator('article .katex').first()).toBeVisible();
});

test('the A* page runs a live frontier demo and a cone-vs-disc comparison', async ({ page }) => {
  await expect(page.locator('.frontier-panel')).toBeVisible();
  // One board for the frontier demo, plus two for the compare demo below it.
  await expect(page.locator('.panel')).toHaveCount(3);
});

test('the Euclidean page runs all three demos, expanding progressively more as the offset straightens into a true diagonal', async ({
  page
}) => {
  await page.getByRole('button', { name: /Euclidean/ }).click();
  await expect(page.locator('.panel')).toHaveCount(6);

  // Each of the three demos' search finishes computing almost immediately;
  // wait for all six verdicts before reading anything, so the numbers below
  // are the real final counts, not a mid-animation snapshot.
  await expect(page.locator('.panel__verdict')).toHaveCount(6, { timeout: 30000 });

  // Then seek every board's own timeline to its end -- settling only means
  // the search has an answer, not that the scrubber animation caught up.
  for (const scrubber of await page.getByRole('slider', { name: 'Timeline' }).all()) {
    await scrubber.fill((await scrubber.getAttribute('max')) ?? '0');
  }

  const expandedCounts: number[] = [];
  for (const panel of await page.locator('.panel').all()) {
    const text = await panel.locator('.panel__stats').innerText();
    expandedCounts.push(Number(text.match(/expanded\s+(\d+)/)?.[1]));
  }

  // [manhattan, euclidean] per demo, in document order: axis-aligned, 2:1
  // offset, then a true 45-degree diagonal.
  const [, straightEuclidean, , lopsidedEuclidean, , diagonalEuclidean] = expandedCounts;

  expect(straightEuclidean).toBeGreaterThan(0);
  // Axis-aligned: Euclidean collapses to Manhattan exactly (see the earlier
  // "hidden-on-axis" lesson) -- no room between the two boards here.
  expect(expandedCounts[0]).toBe(straightEuclidean);
  // Off-axis, Euclidean underestimates increasingly badly as the offset
  // straightens toward a true diagonal -- the whole point of the page.
  expect(lopsidedEuclidean).toBeGreaterThan(straightEuclidean);
  expect(diagonalEuclidean).toBeGreaterThan(lopsidedEuclidean);
});
