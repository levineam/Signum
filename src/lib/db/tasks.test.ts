import { describe, it, expect } from 'vitest';
import { createTask, getTasksByUser, markTaskComplete } from './tasks';

// Note: These tests require Supabase connection and test user setup
// For full integration testing, run against a test database instance
// TODO: Set up proper Supabase mocking for CI (Issue #XXX)

describe.skip('Task CRUD operations', () => {
  const testUserId = 'test-user-id-123';

  it('should create a task', async () => {
    const task = await createTask(
      testUserId,
      'Test task',
      new Date('2025-12-31'),
      { test: true }
    );

    expect(task).toBeDefined();
    expect(task.title).toBe('Test task');
    expect(task.user_id).toBe(testUserId);
    expect(task.status).toBe('pending');
  });

  it('should get tasks by user', async () => {
    const tasks = await getTasksByUser(testUserId);

    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should mark task as complete', async () => {
    const task = await createTask(testUserId, 'Task to complete');
    await markTaskComplete(task.id, testUserId);

    const tasks = await getTasksByUser(testUserId, 'completed');
    const completedTask = tasks.find(t => t.id === task.id);

    expect(completedTask).toBeDefined();
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completed_at).toBeDefined();
  });
});
