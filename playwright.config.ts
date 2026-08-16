import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    // Never reuse: the command rebuilds, and a preview server left over from an
    // earlier build serves stale asset hashes, which makes the suite pass or
    // fail against code that is not the code under test.
    reuseExistingServer: false
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
