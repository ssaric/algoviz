import { expect, test, type Page } from '@playwright/test';

const emptyCell = (page: Page, nth: number) =>
  page.locator('td.cell:not(.cell--start):not(.cell--end)').nth(nth);

const solve = async (page: Page) => {
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('td.cell--path').first()).toBeVisible({ timeout: 20000 });
};

test.beforeEach(async ({ page }) => {
  await page.goto('/sandbox');
  // Painter builds the board on mount, sized from the viewport.
  await expect(page.locator('td.cell').first()).toBeVisible();
});

test('renders the board with a start and an end cell', async ({ page }) => {
  await expect(page.getByRole('navigation').getByText('Algoviz')).toBeVisible();
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

test('hovering a searched cell explains what the algorithm thought', async ({ page }) => {
  // The sandbox's default start and end sit on the same row, where Euclidean
  // collapses to Manhattan (lesson 2's exact scenario) -- on an open board
  // with either, every visited cell ends up on the final path, leaving
  // nothing that is only "expanded". A wall placed directly on that row
  // forces a detour, so Euclidean's usual fan-out (lesson 1) shows up here
  // too instead of a second straight line.
  await page.getByLabel('Heuristic').selectOption('euclidean');
  const start = page.locator('td.cell--start');
  const end = page.locator('td.cell--end');
  const row = Number(await end.getAttribute('data-y'));
  const midColumn = Math.floor(
    (Number(await start.getAttribute('data-x')) + Number(await end.getAttribute('data-x'))) / 2
  );
  await page.locator(`td[data-x="${midColumn}"][data-y="${row}"]`).click();
  await solve(page);
  // solve() only waits for the first path cell to appear -- the backtrack
  // animation is still actively adding more of them at that point, which
  // makes ":not(.cell--path)" a moving target. Wait for playback to fully
  // stop so the class list underneath the hover is no longer changing.
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 20000 });

  // A cell the search expanded but that never made it onto the final path --
  // .cell--visited alone can also match a path cell, whose badge would
  // correctly read "On the path" instead.
  await page.locator('td.cell--visited:not(.cell--path)').nth(3).hover();

  const thoughts = page.locator('.thoughts');
  await expect(thoughts).toBeVisible();
  await expect(thoughts).toContainText('Expanded');
  await expect(thoughts).toContainText('f = g + h');
});

test('no popup appears before a search has run', async ({ page }) => {
  await emptyCell(page, 300).hover();

  await expect(page.locator('.thoughts')).toHaveCount(0);
});

test('switching algorithm changes the explanation and the work done', async ({ page }) => {
  await solve(page);
  const stats = page.getByTestId('stats');
  await expect(stats).toBeVisible();
  const astarText = await stats.textContent();

  await page.getByLabel('Algorithm').selectOption('dijkstra');
  // Changing the algorithm invalidates the previous run.
  await expect(page.locator('td.cell--visited')).toHaveCount(0);

  await solve(page);
  await expect(stats).not.toHaveText(astarText ?? '');

  await page.locator('td.cell--visited').nth(3).hover();
  await expect(page.locator('.thoughts')).toContainText('cheapest cell reached so far');
});

test('the heuristic picker switches off for algorithms that ignore it', async ({ page }) => {
  await expect(page.getByLabel('Heuristic')).toBeEnabled();

  await page.getByLabel('Algorithm').selectOption('bfs');

  await expect(page.getByLabel('Heuristic')).toBeDisabled();
  await expect(page.getByText('does not use a heuristic')).toBeVisible();
});

test('greedy best-first expands fewer cells than dijkstra', async ({ page }) => {
  const expandedWith = async (algorithm: string) => {
    await page.getByLabel('Algorithm').selectOption(algorithm);
    await solve(page);
    return page.locator('td.cell--visited').count();
  };

  // Wall off a direct route so the two strategies visibly diverge.
  const end = page.locator('td.cell--end');
  const x = Number(await end.getAttribute('data-x'));
  for (let y = 0; y < 14; y++) {
    await page.locator(`td[data-x="${x - 6}"][data-y="${y}"]`).click();
  }

  expect(await expandedWith('greedy')).toBeLessThan(await expandedWith('dijkstra'));
});

test('the custom formula editor validates as you type', async ({ page }) => {
  await page.getByLabel('Heuristic').selectOption('custom');

  const input = page.getByLabel('Custom heuristic formula');
  const apply = page.getByRole('button', { name: 'Apply' });

  await expect(input).toHaveValue('sqrt(x^2 + y^2)');
  await expect(page.getByText('this scores 5')).toBeVisible();
  // Nothing to apply until the formula actually changes.
  await expect(apply).toBeDisabled();

  await input.fill('sqrt(x^2 +');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(apply).toBeDisabled();

  await input.fill('abs(x) * 2 + abs(y)');
  await expect(page.getByText('this scores 10')).toBeVisible();
  await expect(apply).toBeEnabled();

  await apply.click();
  await expect(apply).toBeDisabled();
  await solve(page);
});

test('a formula preset can be applied in one click', async ({ page }) => {
  await page.getByLabel('Heuristic').selectOption('custom');

  await page.getByRole('button', { name: 'Chebyshev' }).click();

  await expect(page.getByLabel('Custom heuristic formula')).toHaveValue('max(abs(x), abs(y))');
  await solve(page);
});

test('euclidean squared explores less than manhattan but may lose the shortest path', async ({
  page
}) => {
  const expandedWith = async (heuristic: string) => {
    await page.getByLabel('Heuristic').selectOption(heuristic);
    await solve(page);
    return page.locator('td.cell--visited').count();
  };

  // Offset the goal diagonally; on a straight line every heuristic agrees.
  const end = page.locator('td.cell--end');
  const x = Number(await end.getAttribute('data-x'));
  const y = Number(await end.getAttribute('data-y'));
  await end.hover();
  await page.mouse.down();
  await page.locator(`td[data-x="${x}"][data-y="${y - 10}"]`).hover();
  await page.mouse.up();

  expect(await expandedWith('euclidean-squared')).toBeLessThan(await expandedWith('euclidean'));
});

test('reset grid clears walls', async ({ page }) => {
  const cell = emptyCell(page, 20);
  await cell.click();
  await expect(cell).toHaveClass(/cell--wall/);

  await page.getByRole('button', { name: 'Reset Grid' }).click();

  await expect(page.locator('td.cell--wall')).toHaveCount(0);
});

test('the single-step buttons move the timeline by exactly one step', async ({ page }) => {
  await solve(page);
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 20000 });

  const scrubber = page.getByRole('slider', { name: 'Timeline' });
  await scrubber.fill('20');
  expect(await scrubber.inputValue()).toBe('20');

  await page.getByRole('button', { name: 'Step forward one' }).click();
  expect(await scrubber.inputValue()).toBe('21');

  await page.getByRole('button', { name: 'Step back one' }).click();
  await page.getByRole('button', { name: 'Step back one' }).click();
  expect(await scrubber.inputValue()).toBe('19');
});

test('the skip buttons move by more than a single step', async ({ page }) => {
  await solve(page);
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 20000 });

  const scrubber = page.getByRole('slider', { name: 'Timeline' });
  await scrubber.fill('20');
  await page.getByRole('button', { name: 'Skip backward' }).click();
  const afterSkip = Number(await scrubber.inputValue());

  expect(afterSkip).toBeLessThan(19);
});

test('the stats line updates live during playback, not just at the end', async ({ page }) => {
  // The default start/end sit on the same row, where every heuristic is
  // exact; a wall forces some cells to be explored and discarded so the
  // expanded count actually keeps climbing rather than jumping straight to
  // its final value in one step.
  await page.getByLabel('Heuristic').selectOption('euclidean');
  const start = page.locator('td.cell--start');
  const end = page.locator('td.cell--end');
  const row = Number(await end.getAttribute('data-y'));
  const midColumn = Math.floor(
    (Number(await start.getAttribute('data-x')) + Number(await end.getAttribute('data-x'))) / 2
  );
  await page.locator(`td[data-x="${midColumn}"][data-y="${row}"]`).click();

  await page.getByRole('button', { name: 'Play' }).click();

  const stats = page.getByTestId('stats');
  await expect(stats).toBeVisible({ timeout: 20000 });
  const early = await stats.innerText();
  const earlyExpanded = Number(early.match(/(\d+)\s+expanded/)?.[1]);

  await expect(page.locator('td.cell--path').first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 20000 });
  const scrubber = page.getByRole('slider', { name: 'Timeline' });
  await scrubber.fill((await scrubber.getAttribute('max')) ?? '0');

  const final = await stats.innerText();
  const finalExpanded = Number(final.match(/(\d+)\s+expanded/)?.[1]);

  expect(earlyExpanded).toBeGreaterThan(0);
  expect(earlyExpanded).toBeLessThan(finalExpanded);
});
