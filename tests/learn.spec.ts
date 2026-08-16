import { expect, test, type Locator, type Page } from '@playwright/test';

const boards = (page: Page) => page.locator('.panel');
const settled = async (page: Page) => {
  // Both searches finish and report a verdict.
  await expect(page.locator('.panel__verdict')).toHaveCount(2, { timeout: 30000 });
};

/** The search finishing and the scrubber animation catching up to the end are
 *  two different things -- `settled` only waits for the former. The figures
 *  under a board are now live against wherever the scrubber sits, so reading
 *  "the final numbers" means explicitly moving it there first. */
const seekToEnd = async (page: Page) => {
  const scrubber = page.getByRole('slider', { name: 'Timeline' });
  await scrubber.fill((await scrubber.getAttribute('max')) ?? '0');
};

// The suite below covers "compare" lessons (two boards, one clock), which is
// still most of them. It pins to a specific one rather than relying on "the
// default lesson", since the default is now a "frontier" lesson with a single
// board -- covered in its own block further down.
test.beforeEach(async ({ page }) => {
  await page.goto('/?lesson=exact-vs-optimistic');
  await expect(page.locator('td.cell').first()).toBeVisible();
});

test('a compare lesson runs two boards on one clock', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('exact heuristic');
  await expect(boards(page)).toHaveCount(2);
  await settled(page);
});

test('shows the measured cost of an optimistic heuristic', async ({ page }) => {
  await settled(page);
  await seekToEnd(page);

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

test('the popup names the heuristic and renders its maths', async ({ page }) => {
  await settled(page);

  await page.locator('.panel').nth(1).locator('td.cell--visited').nth(20).hover();

  const thoughts = page.locator('.thoughts');
  await expect(thoughts).toBeVisible();
  // Which run produced this, spelled out.
  await expect(thoughts).toContainText('A*');
  await expect(thoughts).toContainText('Euclidean');
  // Rule and arithmetic, both typeset.
  expect(await thoughts.locator('.katex').count()).toBeGreaterThanOrEqual(4);
  await expect(thoughts).toContainText('how far it still looks', { ignoreCase: true });
});

test('the popup says when each event happened', async ({ page }) => {
  await settled(page);

  await page.locator('.panel').first().locator('td.cell--path').nth(5).hover();

  await expect(page.locator('.thoughts')).toContainText(/step \d+ of \d+/);
});

test('a heuristic vector points from the hovered cell towards the goal', async ({ page }) => {
  await settled(page);

  await expect(page.locator('.pull-arrow')).toHaveCount(0);
  await page.locator('.panel').first().locator('td.cell--visited').nth(10).hover();

  await expect(page.locator('.pull-arrow')).toHaveCount(1);
  // Manhattan is exact, so a step buys exactly what it costs.
  await expect(page.locator('.thoughts')).toContainText('drops h by 1');
  await expect(page.locator('.thoughts')).toContainText('Exactly what the step costs');
});

test('a search with no heuristic says so instead of showing one', async ({ page }) => {
  await page.goto('/?lesson=same-search-three-names');
  await settled(page);

  await page.locator('.panel').first().locator('td.cell--visited').nth(10).hover();

  await expect(page.locator('.thoughts')).toContainText('No heuristic');
  await expect(page.locator('.pull-arrow')).toHaveCount(0);
});

test('lesson prose typesets its maths', async ({ page }) => {
  await expect(page.locator('article .katex').first()).toBeVisible();
  expect(await page.locator('article .katex').count()).toBeGreaterThan(5);
});

test('each board shows which way x and y increase', async ({ page }) => {
  await expect(boards(page).first().getByText('x →')).toBeVisible();
  await expect(boards(page).first().getByText('y ↓')).toBeVisible();
  await expect(boards(page).nth(1).getByText('x →')).toBeVisible();
});

test.describe('the frontier lessons', () => {
  test('the default lesson is the frontier intro, with one board and a live queue', async ({
    page
  }) => {
    await page.goto('/');
    await expect(page.locator('td.cell').first()).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Meet the frontier');
    await expect(boards(page)).toHaveCount(1);
    await expect(page.locator('.frontier-panel')).toBeVisible();
  });

  test('the frontier panel lists cells in priority order and highlights the next pick', async ({
    page
  }) => {
    await page.goto('/?lesson=meet-the-frontier');

    const panel = page.locator('.frontier-panel');
    await expect(panel).toContainText('waiting');

    // Let the run advance a bit so there is more than one candidate to rank.
    await page.waitForTimeout(400);

    const rows = panel.locator('.frontier-panel__row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // The top row is visually distinguished as "next".
    await expect(rows.first()).toHaveClass(/bg-brand-soft/);
  });

  test('adding a heuristic changes what the frontier ranks first, on the same board', async ({
    page
  }) => {
    await page.goto('/?lesson=adding-a-heuristic');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Adding a heuristic');

    await expect(boards(page)).toHaveCount(1);
    await expect(page.locator('.frontier-panel')).toBeVisible();
    // KaTeX renders operators without literal spaces in the flattened text.
    await expect(page.locator('article')).toContainText('f=g+h');
  });

  test('a frontier lesson can still be hovered for the cell inspector', async ({ page }) => {
    await page.goto('/?lesson=meet-the-frontier');

    // Wait for the run to finish before reading `max` off the scrubber, or it
    // is read while still 0 and the fill below does nothing.
    await expect(page.locator('.panel__verdict')).toHaveCount(1, { timeout: 30000 });
    const scrubber = page.getByRole('slider', { name: 'Timeline' });
    await scrubber.fill((await scrubber.getAttribute('max')) ?? '0');

    await page.locator('.panel').first().locator('td.cell--visited').first().hover();
    await expect(page.locator('.thoughts')).toBeVisible();
  });
});

test.describe('the speed-vs-correctness scoreboard', () => {
  test('has no live board or timeline, just the two charts', async ({ page }) => {
    await page.goto('/?lesson=speed-vs-correctness');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('all at once');
    await expect(page.locator('td.cell')).toHaveCount(0);
    await expect(page.getByRole('slider', { name: 'Timeline' })).toHaveCount(0);
  });

  test('shows five strategies with both a speed and a correctness figure each', async ({
    page
  }) => {
    await page.goto('/?lesson=speed-vs-correctness');

    await expect(page.getByText('Cells expanded')).toBeVisible();
    await expect(page.getByText('Path length vs. shortest possible')).toBeVisible();
    // exact: true, or the substring also matches the row's wrapping element,
    // whose combined text is the label plus the value beside it.
    await expect(page.getByText('A* · Manhattan', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Greedy best-first', { exact: true })).toHaveCount(2);
  });

  test('marks the strategies that got the wrong answer', async ({ page }) => {
    await page.goto('/?lesson=speed-vs-correctness');

    await expect(page.getByText('optimal').first()).toBeVisible();
    await expect(page.getByText(/\+\d+ cells$/).first()).toBeVisible();
  });
});

test.describe('single-step and live figures', () => {
  test('the single-step buttons move the timeline by exactly one step', async ({ page }) => {
    await settled(page);
    const scrubber = page.getByRole('slider', { name: 'Timeline' });
    await scrubber.fill('50');
    expect(await scrubber.inputValue()).toBe('50');

    await page.getByRole('button', { name: 'Step forward one' }).click();
    expect(await scrubber.inputValue()).toBe('51');

    await page.getByRole('button', { name: 'Step forward one' }).click();
    expect(await scrubber.inputValue()).toBe('52');

    await page.getByRole('button', { name: 'Step back one' }).click();
    expect(await scrubber.inputValue()).toBe('51');
  });

  test('the skip buttons still move by a larger amount than a single step', async ({ page }) => {
    await settled(page);
    const scrubber = page.getByRole('slider', { name: 'Timeline' });
    await scrubber.fill('50');

    await page.getByRole('button', { name: 'Skip forward' }).click();
    const afterSkip = Number(await scrubber.inputValue());
    expect(afterSkip).toBeGreaterThan(51);
  });

  test("the board's figures update as the timeline scrubs, not just at the end", async ({
    page
  }) => {
    await settled(page);
    const scrubber = page.getByRole('slider', { name: 'Timeline' });

    await scrubber.fill('5');
    const early = await page.locator('.panel__stats').first().innerText();
    const earlyExpanded = Number(early.match(/expanded\s+(\d+)/)?.[1]);

    await seekToEnd(page);
    const final = await page.locator('.panel__stats').first().innerText();
    const finalExpanded = Number(final.match(/expanded\s+(\d+)/)?.[1]);

    // "This is the final stuff" is not what should show at step 5.
    expect(earlyExpanded).toBeGreaterThan(0);
    expect(earlyExpanded).toBeLessThan(finalExpanded);
  });

  test('the figure keeps a fixed height as the frontier list grows and shrinks', async ({
    page
  }) => {
    await page.goto('/?lesson=meet-the-frontier');
    const figure = page.locator('figure');
    await figure.waitFor();

    const heightAtStart = (await figure.boundingBox())?.height;
    // Let the run progress well into the middle, where the frontier is at
    // its widest and used to make the whole row grow with it.
    await page.waitForTimeout(1500);
    const heightMidRun = (await figure.boundingBox())?.height;

    expect(heightAtStart).toBeGreaterThan(0);
    expect(heightMidRun).toBe(heightAtStart);
  });
});

test.describe('the board narrates its current step', () => {
  test('stays quiet during playback and explains the step once paused', async ({ page }) => {
    const narration = page.locator('.panel__narration').first();
    // Still running: a calm placeholder, not a flicker of per-step text.
    await expect(narration).toContainText('Playing');

    // Paused (seeking always pauses first): the actual step and why.
    await settled(page);
    await page.getByRole('slider', { name: 'Timeline' }).fill('5');
    await expect(narration).not.toContainText('Playing');
    await expect(narration).toContainText(/Cell \(\d+, \d+\):/);
  });

  test('the two boards narrate their own algorithm independently', async ({ page }) => {
    await settled(page);
    // Early into the run, not at the end -- Manhattan and Euclidean settle on
    // the same final path length here, so their last "on the path" narration
    // reads identically. Mid-run is where their differing exploration order
    // actually shows up.
    await page.getByRole('slider', { name: 'Timeline' }).fill('5');
    const [left, right] = await page.locator('.panel__narration').all();
    expect(await left.innerText()).not.toBe(await right.innerText());
  });
});

test.describe('the queue ties the board and the frontier panel together', () => {
  /** The row's cell coordinate, from its `.tabular-nums` span -- not just any
   *  `span`, since the top row's leading `▸` marker is one too. */
  const rowCell = async (row: Locator) => {
    const text = await row.locator('span.tabular-nums').first().innerText();
    const [x, y] = text
      .replace(/[()]/g, '')
      .split(',')
      .map((n) => n.trim());
    return { x, y };
  };

  /** This lesson auto-plays continuously, so reading a row's coordinates and
   *  then hovering them are two separate moments -- by the second one, the
   *  cursor has moved on and that cell is no longer what the row described.
   *  Waiting for a real frontier and then pausing gives a snapshot that
   *  actually holds still for the rest of the test. */
  const frozenFrontier = async (page: Page) => {
    const rows = page.locator('.frontier-panel__row');
    await expect(rows).toHaveCount(2, { timeout: 10000 });
    await page.getByRole('button', { name: 'Stop' }).click();
    return rows;
  };

  test('hovering the cell at the top of the queue says so', async ({ page }) => {
    await page.goto('/?lesson=meet-the-frontier');
    const rows = await frozenFrontier(page);

    const { x, y } = await rowCell(rows.first());
    await page.locator(`td[data-x="${x}"][data-y="${y}"]`).hover();

    await expect(page.locator('.thoughts')).toContainText('Checking this one next');
  });

  test('hovering a queued cell further back reports its position', async ({ page }) => {
    await page.goto('/?lesson=meet-the-frontier');
    const rows = await frozenFrontier(page);

    const { x, y } = await rowCell(rows.nth(1));
    await page.locator(`td[data-x="${x}"][data-y="${y}"]`).hover();

    await expect(page.locator('.thoughts')).toContainText('Currently waiting at position');
  });

  test('hovering a queued cell highlights its row in the frontier panel', async ({ page }) => {
    await page.goto('/?lesson=meet-the-frontier');
    const rows = await frozenFrontier(page);

    const targetRow = rows.nth(1);
    const { x, y } = await rowCell(targetRow);

    // The style attribute always carries a box-shadow declaration; only its
    // value (none vs. an inset ring) says whether the row is highlighted.
    await expect(targetRow).toHaveAttribute('style', /box-shadow:\s*none/);
    await page.locator(`td[data-x="${x}"][data-y="${y}"]`).hover();
    await expect(targetRow).toHaveAttribute('style', /box-shadow:\s*inset/);
  });

  test('a step that just changed the frontier highlights its own row, even if it ranks low', async ({
    page
  }) => {
    await page.goto('/?lesson=meet-the-frontier');
    await expect(page.locator('td.cell').first()).toBeVisible();
    // Rewind to the very start rather than reusing frozenFrontier's "wait for
    // 2 rows" -- on a short run that count can just as easily be caught near
    // the end, and stepping forward from there would only ever hit path
    // steps. The first few steps of any search are reliably discovers.
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('slider', { name: 'Timeline' }).fill('0');

    const narration = page.locator('.panel__narration').first();
    const stepForward = page.getByRole('button', { name: 'Step forward one' });
    let text = '';
    for (let i = 0; i < 20; i++) {
      await stepForward.click();
      text = (await narration.innerText()).toUpperCase();
      if (text.includes('DISCOVERED')) break;
    }
    expect(text).toContain('DISCOVERED');

    const [, x, y] = text.match(/CELL \((\d+), (\d+)\)/) ?? [];
    expect(x).toBeDefined();

    // Newly discovered cells rarely rank at the top, so the row is only
    // useful if it's actually on screen rather than folded into the overflow
    // count -- not just correctly ringed.
    const row = page.locator('.frontier-panel__row', { hasText: `(${x}, ${y})` });
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute('style', /box-shadow:\s*inset/);
  });
});

test.describe('the pull vector', () => {
  test('draws all four directions, with the strongest one emphasised', async ({ page }) => {
    await settled(page);
    await page.locator('.panel').first().locator('td.cell--visited').nth(10).hover();

    const arrow = page.locator('.pull-arrow');
    await expect(arrow).toHaveCount(1);
    // One line per direction, drawn twice over (muted pass, then winner pass).
    expect(await arrow.locator('line').count()).toBe(4);

    const winners = arrow.locator('line[stroke="var(--color-vector)"]');
    const muted = arrow.locator('line[stroke="var(--color-ink-subtle)"]');
    expect(await winners.count()).toBeGreaterThanOrEqual(1);
    expect((await winners.count()) + (await muted.count())).toBe(4);
  });
});

test.describe('reading like an article', () => {
  test('the lede appears before the board figure, and the rest of the body after', async ({
    page
  }) => {
    // The lede is the paragraph directly under the intro wrapper -- not the
    // "Lesson N of M" label, which sits nested inside the header above it.
    const ledeBox = await page.locator('article > div > p').first().boundingBox();
    const figureBox = await page.locator('figure').boundingBox();
    const restBox = await page.locator('article > div:last-of-type > p').first().boundingBox();

    expect(ledeBox).not.toBeNull();
    expect(figureBox).not.toBeNull();
    expect(restBox).not.toBeNull();
    expect(ledeBox!.y).toBeLessThan(figureBox!.y);
    expect(figureBox!.y).toBeLessThan(restBox!.y);
  });

  test('previous/next navigation moves between adjacent lessons', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Next lesson' });
    await expect(nav).toBeVisible();

    const startTitle = await page.getByRole('heading', { level: 1 }).textContent();

    await nav.getByRole('button', { name: /Next/ }).click();
    await expect(page).not.toHaveURL(/lesson=exact-vs-optimistic/);
    const nextTitle = await page.getByRole('heading', { level: 1 }).textContent();
    expect(nextTitle).not.toBe(startTitle);

    await nav.getByRole('button', { name: /Previous/ }).click();
    await expect(page).toHaveURL(/lesson=exact-vs-optimistic/);
    expect(await page.getByRole('heading', { level: 1 }).textContent()).toBe(startTitle);
  });
});
