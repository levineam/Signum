/**
 * Tests for markdown-to-html conversion utility
 */

import { describe, it, expect } from 'vitest'
import { convertMarkdownToHtml } from '../markdown-to-html'

describe('convertMarkdownToHtml', () => {
  it('converts basic markdown to HTML', async () => {
    const markdown = '## Hello World\n\nThis is **bold** text.'
    const result = await convertMarkdownToHtml(markdown)

    expect(result).toContain('<h2>Hello World</h2>')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('converts bullet lists', async () => {
    const markdown = '- Item 1\n- Item 2\n- Item 3'
    const result = await convertMarkdownToHtml(markdown)

    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Item 1</li>')
    expect(result).toContain('<li>Item 2</li>')
  })

  it('converts numbered lists', async () => {
    const markdown = '1. First\n2. Second\n3. Third'
    const result = await convertMarkdownToHtml(markdown)

    expect(result).toContain('<ol>')
    expect(result).toContain('<li>First</li>')
    expect(result).toContain('<li>Second</li>')
  })

  it('converts blockquotes', async () => {
    const markdown = '> This is a quote'
    const result = await convertMarkdownToHtml(markdown)

    expect(result).toContain('<blockquote>')
    expect(result).toContain('This is a quote')
  })

  it('handles mixed formatting', async () => {
    const markdown = `## Managing Stress

Here are some **evidence-based** strategies:

- *Deep breathing*
- **Progressive muscle relaxation**
- Meditation

> Remember: Small steps lead to big changes.`

    const result = await convertMarkdownToHtml(markdown)

    expect(result).toContain('<h2>Managing Stress</h2>')
    expect(result).toContain('<strong>evidence-based</strong>')
    expect(result).toContain('<em>Deep breathing</em>')
    expect(result).toContain('<ul>')
    expect(result).toContain('<blockquote>')
  })

  it('handles empty input gracefully', async () => {
    const result = await convertMarkdownToHtml('')

    // Should not throw, returns empty or minimal HTML
    expect(result).toBeDefined()
  })

  it('handles plain text without markdown', async () => {
    const plainText = 'This is just plain text without any formatting.'
    const result = await convertMarkdownToHtml(plainText)

    expect(result).toContain('This is just plain text')
    expect(result).toContain('<p>')
  })
})
