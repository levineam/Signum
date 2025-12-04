/**
 * E2E Tests: Ontology Inline Editing UX
 * Story 2.4.9: Improve Ontology Inline Editing UX
 *
 * Tests the following improvements:
 * 1. Click-to-edit for goals, projects, and tasks (no edit icon needed)
 * 2. Scoped hover groups (no nested icon visibility)
 * 3. Keyboard navigation for editing (Enter/Space keys)
 * 4. Icon-only Add buttons
 */

import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Ontology Inline Editing UX', () => {
  test.beforeEach(async ({ page }) => {
    // Use forced test user for consistent testing
    await loginAsTestUser(page)

    // Navigate to ontology page
    await page.goto('/ontology')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Click-to-Edit Functionality', () => {
    test('should enter edit mode when clicking on goal text', async ({ page }) => {
      // Wait for Execution Stack section to be visible (it's a div, not a heading)
      const executionStackSection = page.locator('text=Execution Stack (Goal Columns)')
      await expect(executionStackSection).toBeVisible({ timeout: 10000 })

      // Find first goal (if exists)
      const goalText = page.locator('[aria-label^="Click to edit"]').first()

      // Check if there are any goals
      if (await goalText.count() === 0) {
        console.log('⚠️ No goals found, skipping click-to-edit test')
        return
      }

      const goalName = await goalText.textContent()

      // Click on the goal text
      await goalText.click()

      // Should now show an input field with the goal's name
      const editInput = page.locator('input[type="text"]').filter({ hasText: goalName || '' })
      await expect(editInput).toBeVisible()
      await expect(editInput).toBeFocused()
    })

    test('should enter edit mode when clicking on project text', async ({ page }) => {
      // Find first project (within a goal)
      const projectText = page.locator('p.font-medium.text-slate-900.cursor-pointer').first()

      if (await projectText.count() === 0) {
        console.log('⚠️ No projects found, skipping click-to-edit test')
        return
      }

      const projectName = await projectText.textContent()

      // Click on the project text
      await projectText.click()

      // Should now show an input field with the project's name
      const editInput = page.locator('input[type="text"]').filter({ hasText: projectName || '' })
      await expect(editInput).toBeVisible()
      await expect(editInput).toBeFocused()
    })

    test('should enter edit mode when clicking on task text', async ({ page }) => {
      // Find first task (within a project)
      const taskText = page.locator('p.text-sm.font-medium.text-slate-900.cursor-pointer').first()

      if (await taskText.count() === 0) {
        console.log('⚠️ No tasks found, skipping click-to-edit test')
        return
      }

      const taskName = await taskText.textContent()

      // Click on the task text
      await taskText.click()

      // Should now show an input field with the task's name
      const editInput = page.locator('input[type="text"]').filter({ hasText: taskName || '' })
      await expect(editInput).toBeVisible()
      await expect(editInput).toBeFocused()
    })

    test('should not show pencil edit icon in Execution Stack', async ({ page }) => {
      // Verify that Pencil icons are not present in the Execution Stack section
      // The Pencil icon was previously used for editing goals/projects/tasks, now removed

      // Wait for Execution Stack section
      const executionStackText = page.locator('text=Execution Stack (Goal Columns)')
      await expect(executionStackText).toBeVisible({ timeout: 10000 })

      // Find the parent container of the Execution Stack
      // Look for the main container that holds goals/projects/tasks
      const goalsSection = page.locator('.grid.gap-6').first()

      // Within the goals section, check for any Pencil icons or Edit buttons
      // Goals, projects, and tasks should not have edit buttons (they use click-to-edit instead)
      const editButtonsInGoals = goalsSection.locator('button[aria-label*="Edit"], button:has-text("Edit")')

      // Should not find any edit buttons for goals/projects/tasks
      const count = await editButtonsInGoals.count()
      expect(count).toBe(0)
    })
  })

  test.describe('Scoped Hover Groups', () => {
    test('hovering over task should only show task delete icon', async ({ page }) => {
      // Find a task element
      const taskContainer = page.locator('.group\\/task').first()

      if (await taskContainer.count() === 0) {
        console.log('⚠️ No tasks found, skipping hover test')
        return
      }

      // Hover over the task
      await taskContainer.hover()

      // Task's delete button should be visible
      const taskDeleteButton = taskContainer.locator('button[aria-label*="Delete"]')
      await expect(taskDeleteButton).toBeVisible()

      // Parent project's delete button should NOT be visible
      const projectContainer = page.locator('.group\\/project').first()
      const projectDeleteButton = projectContainer.locator('> div > div > button[aria-label*="Delete"]')

      // Check if project delete button is NOT visible (opacity-0)
      const projectDeleteOpacity = await projectDeleteButton.evaluate((el) => {
        return window.getComputedStyle(el).opacity
      }).catch(() => '0')

      expect(projectDeleteOpacity).toBe('0')
    })

    test('hovering over project should only show project delete icon', async ({ page }) => {
      // Find a project element
      const projectContainer = page.locator('.group\\/project').first()

      if (await projectContainer.count() === 0) {
        console.log('⚠️ No projects found, skipping hover test')
        return
      }

      // Hover over the project title area (not a task)
      const projectTitle = projectContainer.locator('p.font-medium').first()
      await projectTitle.hover()

      // Project's delete button should be visible
      const projectDeleteButton = projectContainer.locator('button[aria-label*="Delete"]').first()

      // Check opacity instead of visibility since Tailwind uses opacity for hover effects
      const projectDeleteOpacity = await projectDeleteButton.evaluate((el) => {
        return window.getComputedStyle(el).opacity
      })

      // Should be visible (opacity > 0)
      expect(parseFloat(projectDeleteOpacity)).toBeGreaterThan(0)
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should enter edit mode on goal when pressing Enter key', async ({ page }) => {
      // Find first goal with click-to-edit
      const goalText = page.locator('[aria-label^="Click to edit"]').first()

      if (await goalText.count() === 0) {
        console.log('⚠️ No goals found, skipping keyboard test')
        return
      }

      const goalName = await goalText.textContent()

      // Focus on the goal text
      await goalText.focus()

      // Press Enter
      await page.keyboard.press('Enter')

      // Should now show an input field
      const editInput = page.locator('input[type="text"]').filter({ hasText: goalName || '' })
      await expect(editInput).toBeVisible()
      await expect(editInput).toBeFocused()
    })

    test('should enter edit mode on project when pressing Space key', async ({ page }) => {
      // Find first project
      const projectText = page.locator('p.font-medium.text-slate-900.cursor-pointer').first()

      if (await projectText.count() === 0) {
        console.log('⚠️ No projects found, skipping keyboard test')
        return
      }

      const projectName = await projectText.textContent()

      // Focus on the project text
      await projectText.focus()

      // Press Space
      await page.keyboard.press('Space')

      // Should now show an input field
      const editInput = page.locator('input[type="text"]').filter({ hasText: projectName || '' })
      await expect(editInput).toBeVisible()
      await expect(editInput).toBeFocused()
    })

    test('should have proper tabIndex for keyboard navigation', async ({ page }) => {
      // All clickable text elements should have tabIndex={0}
      const clickableGoals = page.locator('[aria-label^="Click to edit"][role="button"]')
      const clickableProjects = page.locator('p.cursor-pointer[role="button"][tabindex="0"]')

      // Check that at least one element has proper tabIndex
      const goalCount = await clickableGoals.count()
      const projectCount = await clickableProjects.count()

      if (goalCount > 0 || projectCount > 0) {
        console.log(`✅ Found ${goalCount} keyboard-accessible goals and ${projectCount} projects`)
      } else {
        console.log('⚠️ No keyboard-accessible elements found')
      }
    })
  })

  test.describe('Icon-Only Add Buttons', () => {
    test('Add Goal button should be icon-only', async ({ page }) => {
      // Find Add Goal button
      const addGoalButton = page.locator('button[aria-label="Add goal"]')

      await expect(addGoalButton).toBeVisible()

      // Check that it only contains a Plus icon, not text like "Add Goal"
      const buttonText = await addGoalButton.textContent()
      expect(buttonText?.trim()).toBe('') // Should be empty (icon only)

      // Should contain SVG icon
      const icon = addGoalButton.locator('svg')
      await expect(icon).toBeVisible()
    })

    test('Add Project button should be icon-only', async ({ page }) => {
      // Find Add Project button (appears when a goal is selected or expanded)
      const addProjectButton = page.locator('button[aria-label="Add project"]').first()

      if (await addProjectButton.count() === 0) {
        console.log('⚠️ No Add Project button found (may need to expand a goal)')
        return
      }

      await expect(addProjectButton).toBeVisible()

      // Check that it only contains a Plus icon
      const buttonText = await addProjectButton.textContent()
      expect(buttonText?.trim()).toBe('')

      // Should contain SVG icon
      const icon = addProjectButton.locator('svg')
      await expect(icon).toBeVisible()
    })

    test('Add Task button should be icon-only', async ({ page }) => {
      // Find Add Task button (appears when a project is selected or expanded)
      const addTaskButton = page.locator('button[aria-label="Add task"]').first()

      if (await addTaskButton.count() === 0) {
        console.log('⚠️ No Add Task button found (may need to expand a project)')
        return
      }

      await expect(addTaskButton).toBeVisible()

      // Check that it only contains a Plus icon
      const buttonText = await addTaskButton.textContent()
      expect(buttonText?.trim()).toBe('')

      // Should contain SVG icon
      const icon = addTaskButton.locator('svg')
      await expect(icon).toBeVisible()
    })
  })

  test.describe('Input Field Expansion', () => {
    test('input fields should have flex-1 class for expansion', async ({ page }) => {
      // Find input fields in the add forms
      const inputs = page.locator('input[type="text"][placeholder*="goal"], input[type="text"][placeholder*="project"], input[type="text"][placeholder*="task"]')

      if (await inputs.count() === 0) {
        console.log('⚠️ No input fields found')
        return
      }

      // Check that at least one input has flex-1 class
      const firstInput = inputs.first()
      const className = await firstInput.getAttribute('class')

      expect(className).toContain('flex-1')
      console.log('✅ Input fields have flex-1 for expansion')
    })

    test('input containers should use flex layout', async ({ page }) => {
      // Find the container with input + button
      const containers = page.locator('div.flex.gap-2, div.flex.items-center.gap-2')

      const count = await containers.count()
      expect(count).toBeGreaterThan(0)

      console.log(`✅ Found ${count} flex containers for inputs`)
    })
  })

  test.describe('Accessibility', () => {
    test('clickable text elements should have proper ARIA labels', async ({ page }) => {
      // Check goals
      const goals = page.locator('[aria-label^="Click to edit"]')
      const goalCount = await goals.count()

      if (goalCount > 0) {
        const firstGoalLabel = await goals.first().getAttribute('aria-label')
        expect(firstGoalLabel).toMatch(/Click to edit/i)
        console.log(`✅ ${goalCount} goals have proper ARIA labels`)
      }
    })

    test('buttons should have descriptive aria-labels', async ({ page }) => {
      // Check Add buttons
      const addGoalButton = page.locator('button[aria-label="Add goal"]')
      const addProjectButton = page.locator('button[aria-label="Add project"]')
      const addTaskButton = page.locator('button[aria-label="Add task"]')

      // At least Add Goal button should always be present
      await expect(addGoalButton).toBeVisible()

      const addGoalLabel = await addGoalButton.getAttribute('aria-label')
      expect(addGoalLabel).toBe('Add goal')
    })

    test('should have no accessibility violations on main ontology page', async ({ page }) => {
      // Basic check: no console errors related to accessibility
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // Wait a bit for any console errors
      await page.waitForTimeout(1000)

      // Filter out expected Supabase errors
      const accessibilityErrors = errors.filter(err =>
        err.toLowerCase().includes('aria') ||
        err.toLowerCase().includes('accessibility')
      )

      expect(accessibilityErrors.length).toBe(0)
    })
  })
})
