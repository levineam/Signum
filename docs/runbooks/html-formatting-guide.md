# HTML Formatting in Rich Text Editor

**Last Updated:** 2025-11-23
**Owner:** Engineering

## Overview

SimpleRichEditor provides rich text editing with contentEditable. When adding new formatting features, you MUST update both edit mode AND read-only mode, or the formatting will be stripped by DOMPurify when displaying saved content.

## Quick Reference

| Component | Purpose | Location | Required? |
|-----------|---------|----------|-----------|
| Edit Mode Button | User applies formatting | `SimpleRichEditor.tsx` | ✅ Yes |
| Edit Mode CSS | Shows formatting while editing | `globals.css` → `.rich-editor-body` | ✅ Yes |
| Tag Whitelist | Allows tag in read-only mode | `sanitizeHtml.ts` → `ALLOWED_TAGS` | ✅ Yes |
| Style Whitelist | Allows inline styles | `sanitizeHtml.ts` → `styleFilterHook` | ⚠️ If using inline styles |
| Read-Only CSS | Shows formatting when viewing | `globals.css` → `.prose` | ✅ Yes |

## Common Failure Mode

**Symptom:** Formatting works in editor but disappears when viewing saved content.

**Root Cause:** DOMPurify strips HTML tags/styles not explicitly whitelisted in `sanitizeHtml.ts`.

**Fix:** Follow the step-by-step guide below.

## Step-by-Step Guide

### Step 1: Add Edit Mode Functionality

**File:** `/src/components/editor/SimpleRichEditor.tsx`

Add formatting button and logic:

```tsx
// Example: Adding highlight formatting (wrap selection in <mark>)
const toggleHighlight = (color: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const mark = document.createElement('mark');
  mark.style.backgroundColor = color;
  range.surroundContents(mark);
};

// In toolbar
<button onClick={toggleHighlight} title="Highlight">
  <Highlighter className="w-4 h-4" />
</button>
```

### Step 2: Add Edit Mode Styling

**File:** `/src/app/globals.css`

Add CSS under `.rich-editor-body` class:

```css
/* Edit mode styles */
.rich-editor-body {
  /* Existing styles... */

  /* New formatting */
  mark {
    background-color: #ffeb3b;
    padding: 0.1em 0.2em;
  }
}
```

### Step 3: Update HTML Tag Whitelist

**File:** `/src/utils/sanitizeHtml.ts`

⚠️ **CRITICAL:** Add tag to `ALLOWED_TAGS` array or it will be stripped!

```typescript
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote',
  'a',
  'mark',  // ✅ ADD NEW TAG HERE
];
```

### Step 4: Update Style Whitelist (If Using Inline Styles)

**File:** `/src/utils/sanitizeHtml.ts`

If using inline styles (e.g., `style="background-color: #ffeb3b"`), update `styleFilterHook`:

```typescript
const styleFilterHook = (node: Element) => {
  if (node.tagName === 'MARK') {
    const style = node.getAttribute('style');
    if (style) {
      // Allow only background-color property
      const allowed = style.split(';')
        .filter(s => s.trim().startsWith('background-color'))
        .join(';');
      if (allowed) {
        node.setAttribute('style', allowed);
      } else {
        node.removeAttribute('style');
      }
    }
  }
  // ... existing logic
};
```

### Step 5: Add Read-Only Mode Styling

**File:** `/src/app/globals.css`

Add **identical** styling under `.prose` class:

```css
/* Read-only mode styles */
.prose {
  /* Existing styles... */

  /* New formatting - MUST match .rich-editor-body */
  mark {
    background-color: #ffeb3b;
    padding: 0.1em 0.2em;
  }
}
```

### Step 6: Test Both Modes

1. **Edit Mode Test:**
   ```bash
   npm run dev:test
   ```
   - Create journal entry
   - Apply new formatting
   - Verify it displays correctly while editing

2. **Read-Only Mode Test:**
   - Save the entry
   - View in read-only mode (JournalStream)
   - Verify formatting persists and displays correctly
   - Check browser DevTools that HTML tag is present (not stripped)

## Decision Tree

```
Adding new formatting feature?
├─ Using standard HTML tag (mark, sub, sup)?
│  ├─ Add to ALLOWED_TAGS → ✅
│  ├─ Add CSS to .rich-editor-body → ✅
│  ├─ Add CSS to .prose → ✅
│  └─ Test both modes → ✅
│
├─ Using inline styles?
│  ├─ Add to ALLOWED_TAGS → ✅
│  ├─ Update styleFilterHook → ✅
│  ├─ Add CSS to .rich-editor-body → ✅
│  ├─ Add CSS to .prose → ✅
│  └─ Test both modes → ✅
│
└─ Using custom wrapper (div, span)?
   ├─ Consider using semantic HTML instead
   ├─ Add to ALLOWED_TAGS → ✅
   ├─ Add class-based styling (safer than inline) → ✅
   ├─ Update styleFilterHook if needed → ⚠️
   ├─ Add CSS to .rich-editor-body → ✅
   ├─ Add CSS to .prose → ✅
   └─ Test both modes → ✅
```

## Common Mistakes

### ❌ Mistake 1: Only updating edit mode

**What happens:** Formatting works while editing but disappears when viewing

**Example:**
```tsx
// ❌ Added button to SimpleRichEditor
// ❌ Added CSS to .rich-editor-body
// ❌ FORGOT to add tag to ALLOWED_TAGS
// ❌ FORGOT to add CSS to .prose
```

**Result:** DOMPurify strips the tag, formatting is lost

### ❌ Mistake 2: Using inline styles without whitelisting

**What happens:** Styles are stripped by DOMPurify's style filter

**Example:**
```tsx
// ❌ Added <span style="background: yellow">
// ❌ FORGOT to update styleFilterHook
```

**Result:** Tag remains but style attribute is removed

### ❌ Mistake 3: Inconsistent styling between modes

**What happens:** Formatting looks different in edit vs read-only

**Example:**
```css
/* Edit mode */
.rich-editor-body mark {
  background-color: #ffeb3b;  /* Yellow */
}

/* Read-only mode */
.prose mark {
  background-color: #ffc107;  /* Different yellow! ❌ */
}
```

**Result:** Confusing UX - color changes when viewing saved entry

## Examples

### Example 1: Strikethrough (Simple Tag)

**Step 1:** Add button in `SimpleRichEditor.tsx`
```tsx
const toggleStrikethrough = () => {
  document.execCommand('strikeThrough', false);
  // Normalize <strike> to <s> so sanitizer keeps it
  document.queryCommandValue('strikeThrough'); // triggers execCommand
  document.querySelectorAll('strike').forEach(node => {
    const s = document.createElement('s');
    s.innerHTML = node.innerHTML;
    node.replaceWith(s);
  });
};
```

**Step 2:** Already styled by browser default, but add custom style
```css
.rich-editor-body s,
.prose s {
  text-decoration: line-through;
  opacity: 0.7;
}
```

**Step 3:** Add to whitelist
```typescript
const ALLOWED_TAGS = [..., 's'];
```

### Example 2: Highlight with Color (Inline Styles)

**Step 1:** Add button that wraps selection in `<mark>` (avoid inline `<span>` styles that sanitizer strips)
```tsx
const highlightText = (color: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const mark = document.createElement('mark');
  mark.style.backgroundColor = color;
  range.surroundContents(mark);
};
```

**Step 2:** Add edit mode styling
```css
.rich-editor-body mark {
  padding: 0.1em 0.2em;
  border-radius: 2px;
}
```

**Step 3:** Add to whitelist
```typescript
const ALLOWED_TAGS = [..., 'mark'];
```

**Step 4:** Whitelist background-color style
```typescript
const styleFilterHook = (node: Element) => {
  if (node.tagName === 'MARK') {
    // Allow background-color property only
    const style = node.getAttribute('style');
    if (style && style.includes('background-color')) {
      // Keep only background-color
      const bgColor = style.match(/background-color:\s*[^;]+/)?.[0];
      if (bgColor) {
        node.setAttribute('style', bgColor);
      }
    } else {
      node.removeAttribute('style');
    }
  }
};
```

**Step 5:** Add read-only styling
```css
.prose mark {
  padding: 0.1em 0.2em;
  border-radius: 2px;
}
```

## Troubleshooting

### Issue: Formatting works in editor but disappears when viewing

**Diagnosis:**
1. Open browser DevTools
2. Inspect the saved entry HTML
3. Is the tag present? If NO → not whitelisted in `ALLOWED_TAGS`
4. Is the tag present but unstyled? → missing CSS in `.prose`

**Fix:**
1. Add tag to `ALLOWED_TAGS` in `sanitizeHtml.ts`
2. Add matching CSS to `.prose` in `globals.css`

### Issue: Tag is present but style attribute is missing

**Diagnosis:**
- Tag appears in HTML but inline styles are stripped
- Example: `<mark>text</mark>` but no `style="background-color: yellow"`

**Fix:**
- Update `styleFilterHook` to whitelist the specific CSS property

### Issue: Formatting looks different in edit vs read-only mode

**Diagnosis:**
- Styling is inconsistent between `.rich-editor-body` and `.prose`

**Fix:**
- Copy CSS rules from `.rich-editor-body` to `.prose` exactly
- Consider using CSS variables for shared values:

```css
:root {
  --highlight-color: #ffeb3b;
}

.rich-editor-body mark,
.prose mark {
  background-color: var(--highlight-color);
}
```

## Key Files Reference

| File | Purpose | What to Update |
|------|---------|---------------|
| `/src/components/editor/SimpleRichEditor.tsx` | Rich text editor component | Add formatting buttons, toolbar logic |
| `/src/components/journal/JournalStream.tsx` | Read-only journal view | Usually no changes (uses sanitized HTML) |
| `/src/utils/sanitizeHtml.ts` | HTML/CSS whitelist security | `ALLOWED_TAGS`, `styleFilterHook` |
| `/src/app/globals.css` | Global styles | `.rich-editor-body` and `.prose` classes |

## Security Considerations

**Why we use DOMPurify:**
- Prevents XSS attacks from malicious user input
- Strips unsafe tags (`<script>`, `<iframe>`, etc.)
- Removes dangerous attributes (`onclick`, `onerror`, etc.)

**Why whitelisting is strict:**
- Defense in depth - only allow what's explicitly needed
- Minimize attack surface
- Easier to audit security

**Never bypass sanitization:**
- ❌ Don't use `dangerouslySetInnerHTML` without sanitization
- ❌ Don't disable DOMPurify
- ✅ Always add new tags to whitelist explicitly

## References

- DOMPurify Documentation: https://github.com/cure53/DOMPurify
- contentEditable API: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
- SimpleRichEditor Component: `/src/components/editor/SimpleRichEditor.tsx`
- Sanitization Utils: `/src/utils/sanitizeHtml.ts`
