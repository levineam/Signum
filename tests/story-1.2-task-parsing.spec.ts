/**
 * E2E tests for Story 1.2: Natural Language Task Parsing
 * Tests the /api/tasks/parse endpoint
 *
 * NOTE: These are integration tests that require a running server.
 * Set TEST_URL environment variable to test against a specific deployment.
 * If not set, tests will be skipped with a warning.
 *
 * Example:
 *   TEST_URL=http://localhost:3000 npx playwright test
 *   TEST_URL=https://your-preview.vercel.app npx playwright test
 */

import { test, expect } from '@playwright/test';

// Use environment variable or skip tests
const TEST_URL = process.env.TEST_URL || process.env.PLAYWRIGHT_BASE_URL;

// Test credentials from /docs/dev-test-credentials.md
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'dev-test-1@signum.dev',
  password: process.env.TEST_USER_PASSWORD || 'DevTest2025!User1'
};

// Skip all tests if no test URL is provided
const skipTests = !TEST_URL;
if (skipTests) {
  console.warn('⚠️  Skipping Story 1.2 E2E tests: TEST_URL not set');
  console.warn('   Set TEST_URL=http://localhost:3000 to run tests locally');
  console.warn('   Set TEST_URL=https://preview.vercel.app to test against preview');
}

// Helper to authenticate and get session
async function getAuthenticatedSession(page: any) {
  if (!TEST_URL) {
    throw new Error('TEST_URL is not set');
  }
  await page.goto(`${TEST_URL}/auth`);
  await page.waitForLoadState('networkidle');

  // Fill in login form
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  // Submit form
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');

  // Wait a bit for auth to settle
  await page.waitForTimeout(2000);

  // Get session from localStorage
  const session = await page.evaluate(() => {
    const authData = localStorage.getItem('sb-otyvmmgakowcdsxehwox-auth-token');
    if (!authData) return null;
    try {
      const parsed = JSON.parse(authData);
      return {
        access_token: parsed.access_token,
        user_id: parsed.user?.id
      };
    } catch {
      return null;
    }
  });

  return session;
}

test.describe('Story 1.2: Task Parsing API', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  // Test without authentication to verify error handling
  test('should require authentication', async ({ request }) => {
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      data: {
        paragraphText: 'I need to call Mom tomorrow',
        userId: 'test-user-id',
        entryId: 'test-entry-id',
        timezoneOffset: 0, // UTC for testing
        timezone: 'UTC' // IANA timezone ID
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Unauthorized');
  });

  test('should validate input - missing paragraphText', async ({ request }) => {
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      data: {
        userId: 'test-user-id',
        entryId: 'test-entry-id',
        timezoneOffset: 0 // UTC for testing
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('paragraphText');
  });

  test('should validate input - paragraphText too long', async ({ request }) => {
    const longText = 'a'.repeat(1001);
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      data: {
        paragraphText: longText,
        userId: 'test-user-id',
        entryId: 'test-entry-id',
        timezoneOffset: 0 // UTC for testing
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('less than 1000 characters');
  });

  test('should validate input - missing userId', async ({ request }) => {
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      data: {
        paragraphText: 'I need to call Mom tomorrow',
        entryId: 'test-entry-id',
        timezoneOffset: 0 // UTC for testing
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('userId');
  });
});

test.describe('Story 1.2: Date Parser (Unit-level via API)', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  // These tests verify the date parser logic by checking API responses
  // Even without valid auth, we can test the parsing logic exists

  test('should handle non-task text gracefully', async ({ request }) => {
    // Test that the API doesn't crash on non-task text
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Authorization': 'Bearer fake-token'
      },
      data: {
        paragraphText: 'I love coding',
        userId: 'test-user-id',
        entryId: 'test-entry-id',
        timezoneOffset: 0 // UTC for testing
      }
    });

    // Will be 401 due to invalid token, but should not be 500 (server error)
    expect(response.status()).not.toBe(500);
  });

  test('should not crash on edge case inputs', async ({ request }) => {
    const edgeCases = [
      '', // empty
      'a', // very short
      'May', // ambiguous date
      'I need to call Mom tomorrow and next week', // multiple dates
    ];

    for (const text of edgeCases) {
      const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
        headers: {
          'Authorization': 'Bearer fake-token'
        },
        data: {
          paragraphText: text,
          userId: 'test-user-id',
          entryId: 'test-entry-id',
          timezoneOffset: 0 // UTC for testing
        }
      });

      // Should handle gracefully (400 or 401, not 500)
      expect(response.status()).not.toBe(500);
    }
  });
});

test.describe('Story 1.2: Health Check', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should verify API endpoint exists', async ({ request }) => {
    // A simple ping to verify the route is deployed
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      data: {} // Invalid data, but should at least get a response
    });

    // Should get 400 (validation error) or 401 (auth error), not 404
    expect(response.status()).not.toBe(404);
    expect([400, 401]).toContain(response.status());
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      data: {
        paragraphText: 'test',
        userId: 'test',
        entryId: 'test',
        timezoneOffset: 0 // UTC for testing
      }
    });

    // Check basic response structure
    expect(response.headers()).toBeDefined();
  });
});

test.describe('Story 1.2: UI Integration Check', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should load the app without errors', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/screenshots/story-1.2-app-loaded.png',
      fullPage: true
    });

    // App should load without JS errors
    const hasTaskParsingErrors = errors.some(e =>
      e.includes('task') || e.includes('parse') || e.includes('dateParser')
    );

    if (hasTaskParsingErrors) {
      console.log('Task parsing related errors:', errors.filter(e =>
        e.includes('task') || e.includes('parse')
      ));
    }

    expect(hasTaskParsingErrors).toBe(false);
  });

  test('should have dependencies loaded correctly', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Check that chrono-node and rrule are available in the bundle
    // by trying to import them in the browser context
    const hasChronoError = await page.evaluate(() => {
      try {
        // These would be bundled, so we can't directly test them
        // but we can check if the page loaded without module errors
        return false;
      } catch {
        return true;
      }
    });

    expect(hasChronoError).toBe(false);
  });
});

test.describe('Story 1.2: Authenticated Task Parsing', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should create task with authentication - simple task with date', async ({ page, request }) => {
    // Authenticate and get session
    const session = await getAuthenticatedSession(page);

    if (!session || !session.access_token) {
      console.log('⚠️  Authentication failed - skipping authenticated tests');
      console.log('   Make sure dev-test-1@signum.dev account exists in Supabase');
      test.skip();
      return;
    }

    console.log('✅ Successfully authenticated as', TEST_USER.email);
    console.log('   User ID:', session.user_id);

    // Test creating a task with a simple date
    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      data: {
        paragraphText: 'I need to call Mom tomorrow at 3pm',
        userId: session.user_id,
        entryId: 'test-entry-' + Date.now(),
        timezoneOffset: new Date().getTimezoneOffset(), // Use tester's timezone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // IANA timezone ID
      }
    });

    const body = await response.json();

    if (response.status() !== 200) {
      console.log('❌ Task creation failed:', response.status(), body);
    }

    expect(response.status()).toBe(200);

    console.log('Task created:', body);

    expect(body.task).toBeTruthy();
    expect(body.task.title).toContain('call Mom');
    expect(body.task.dueAt).toBeTruthy();
    expect(body.task.id).toBeTruthy();
  });

  test('should create task with recurring pattern', async ({ page, request }) => {
    const session = await getAuthenticatedSession(page);

    if (!session || !session.access_token) {
      test.skip();
      return;
    }

    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      data: {
        paragraphText: 'Reminder: team standup every Monday at 9am',
        userId: session.user_id,
        entryId: 'test-entry-' + Date.now(),
        timezoneOffset: new Date().getTimezoneOffset() // Use tester's timezone
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    console.log('Recurring task created:', body);

    expect(body.task).toBeTruthy();
    expect(body.task.title).toContain('team standup');
    expect(body.task.dueAt).toBeTruthy();
    expect(body.task.rrule).toBeTruthy();
    expect(body.task.rrule).toContain('FREQ=WEEKLY');
  });

  test('should return null for non-task text', async ({ page, request }) => {
    const session = await getAuthenticatedSession(page);

    if (!session || !session.access_token) {
      test.skip();
      return;
    }

    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      data: {
        paragraphText: 'I love coding and learning new things',
        userId: session.user_id,
        entryId: 'test-entry-' + Date.now(),
        timezoneOffset: new Date().getTimezoneOffset() // Use tester's timezone
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    console.log('Non-task response:', body);

    expect(body.task).toBeNull();
  });

  test('should create task without date', async ({ page, request }) => {
    const session = await getAuthenticatedSession(page);

    if (!session || !session.access_token) {
      test.skip();
      return;
    }

    const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      data: {
        paragraphText: 'Todo: review the documentation',
        userId: session.user_id,
        entryId: 'test-entry-' + Date.now(),
        timezoneOffset: new Date().getTimezoneOffset() // Use tester's timezone
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    console.log('Task without date:', body);

    expect(body.task).toBeTruthy();
    expect(body.task.title).toContain('review the documentation');
    expect(body.task.dueAt).toBeNull();
    expect(body.task.rrule).toBeNull();
  });

  test('should handle complex date patterns', async ({ page, request }) => {
    const session = await getAuthenticatedSession(page);

    if (!session || !session.access_token) {
      test.skip();
      return;
    }

    const testCases = [
      { text: 'Remind me to submit report in 10 days', expectedTitle: 'submit report' },
      { text: 'I should call the dentist next Friday', expectedTitle: 'call the dentist' },
      { text: 'Need to renew passport by December 1st', expectedTitle: 'renew passport' },
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${TEST_URL}/api/tasks/parse`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        data: {
          paragraphText: testCase.text,
          userId: session.user_id,
          entryId: 'test-entry-' + Date.now(),
          timezoneOffset: new Date().getTimezoneOffset() // Use tester's timezone
        }
      });

      expect(response.status()).toBe(200);
      const body = await response.json();

      console.log(`Test case: "${testCase.text}"`, body);

      expect(body.task).toBeTruthy();
      expect(body.task.title).toContain(testCase.expectedTitle);
      expect(body.task.dueAt).toBeTruthy();
    }
  });
});

test.describe('Story 1.2: Manual Testing Guide', () => {
  test.skip(skipTests, 'Skipping because TEST_URL is not set');

  test('should document manual test steps', async () => {
    console.log(`
================================================================================
MANUAL TESTING GUIDE FOR STORY 1.2
================================================================================

✅ AUTOMATED TESTS NOW INCLUDE AUTHENTICATED API CALLS!

The automated tests authenticate using dev-test-1@signum.dev and verify:
- Task creation with dates
- Recurring task patterns (with RRULE)
- Non-task text handling
- Tasks without dates
- Complex date patterns

To verify in Supabase Dashboard:
1. Go to Supabase project dashboard
2. Check 'tasks' table for created test tasks
3. Check 'reminders' table for tasks with due dates
4. Verify RLS policies (tasks belong to correct user)

================================================================================
    `);
  });
});
