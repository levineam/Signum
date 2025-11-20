# Story 2.13: Reduce Nested Container Padding in Journal Editor

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-11-14
**Updated:** 2025-11-14 (Codex review applied)
**Issue:** #178
**Parent Epic:** Epic 2 (AI-Powered Personal Ontology & UX Polish)
**Prerequisites:**
- SimpleRichEditor component (existing)
- JournalStream component (existing)

---

## Story

As a user,
I want the journal entry editor to use the full available width of its container,
so that I have maximum space for reading and writing without unnecessary padding reducing the usable area.

---

## Why This Matters

**Current State:**
- Journal entries in edit mode display a "container inside a container" with visible padding
- The WYSIWYG editor has significant padding between itself and its containing element
- This nested structure reduces the total usable area for content, particularly noticeable on smaller displays

**Problems:**
- **Reduced usable space**: Nested padding takes up ~20-40px on each side (40-80px total width lost)
- **Visual clutter**: Extra container borders/backgrounds create unnecessary visual hierarchy
- **Inconsistent spacing**: Read-only mode may have different spacing than edit mode
- **Mobile impact**: On smaller screens (tablets, phones), the lost space is more significant percentage-wise

**Benefits:**
- **Maximized writing area**: Full container width available for content
- **Cleaner visual design**: Reduced nesting creates simpler, more elegant interface
- **Better mobile experience**: Critical on smaller viewports where every pixel counts
- **Consistent spacing**: Unified spacing model across read and edit modes

---

## Scope

### In Scope

**1. Edit Mode Container Adjustments (shadcn Card Pattern)**
- **shadcn Design System Alignment**: Journal surface uses shadcn `Card` component
- Remove ad-hoc `p-6` wrappers; use Card's `CardContent` component with proper spacing props
- Leverage shadcn spacing scale: `px-3` (12px) on mobile, `px-2` (8px) on desktop (target values)
- Align editor edge with Card boundaries using slot-specific padding (not arbitrary wrappers)
- Ensure WYSIWYG toolbar remains properly positioned and accessible
- Maintain editor functionality (formatting, cursor position, selection, etc.)

**2. Read-Only Mode Alignment**
- Ensure read-only journal entries have consistent padding with edit mode
- Verify prose styling (`.prose` class) doesn't introduce misaligned padding
- Test that content width matches between modes

**3. Responsive Behavior**
- Test padding changes at all breakpoints (mobile <768px, tablet 768-1279px, desktop ≥1280px)
- Ensure no overflow issues or horizontal scrolling introduced
- Maintain responsive layout integrity

**4. Visual Refinement**
- Remove unnecessary nested containers if identified
- Simplify CSS structure for maintainability
- Ensure consistent focus states and borders

### Out of Scope

- Changing toolbar button sizes or layout (unless required for padding fix)
- Adding new editor features or formatting options
- Modifying sanitization logic (`sanitizeHtml.ts`)
- Changes to other journal components beyond padding/spacing
- Database schema or API changes
- Major refactoring of SimpleRichEditor component architecture

---

## Technical Design

### Affected Components

**Primary:**
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor component
- `/src/components/journal/JournalStream.tsx` - Journal entry display

**Secondary:**
- `/src/app/globals.css` - Styling for `.rich-editor-body` and `.prose` classes

### CSS/Styling Changes

**Current Structure (Identified Issue):**
```tsx
// Outer container (JournalStream or similar)
<div className="container-outer">
  {/* Inner container (SimpleRichEditor wrapper) */}
  <div className="container-inner padding-lg">
    {/* Editor body */}
    <div className="rich-editor-body padding-md">
      {/* Content */}
    </div>
  </div>
</div>
```

**Proposed Structure:**
```tsx
// Simplified container hierarchy
<div className="container-outer">
  {/* Editor body - aligned to container edge */}
  <div className="rich-editor-body padding-sm">
    {/* Content */}
  </div>
</div>
```

**Specific Changes:**
1. **Reduce `.rich-editor-body` padding**: From current value to shadcn spacing scale (`px-3` mobile, `px-2` desktop)
2. **Remove nested wrapper padding**: Eliminate ad-hoc `p-6` wrappers; use `CardContent` with proper spacing
3. **SimpleRichEditor component refactor**:
   - Current component has hardcoded `border rounded-md p-4`
   - Add `variant` prop or `className` escape hatch for flush rendering
   - Journal can render flush version (`variant="flush"`), other features keep default chrome
   - Example: `<SimpleRichEditor variant="flush" />` removes internal padding/border
4. **Align toolbar**: Ensure toolbar aligns with content area edge
5. **Consistent read/write modes**: Match `.prose` padding to editor padding using shadcn tokens

### Design System Compliance

**CRITICAL: shadcn Pattern Alignment**

This story must strictly adhere to the shadcn/ui design system used throughout Signum:

1. **Card Component Pattern**:
   - Journal surfaces use shadcn `Card` component
   - Use `CardContent` slot for content with proper spacing props
   - **Do NOT use** ad-hoc `p-6`, `p-4` wrappers outside Card slots
   - Example correct pattern:
     ```tsx
     <Card>
       <CardContent className="px-3 md:px-2">
         <SimpleRichEditor variant="flush" />
       </CardContent>
     </Card>
     ```

2. **Spacing Scale**:
   - Use shadcn spacing tokens: `px-2` (8px), `px-3` (12px), `px-4` (16px)
   - Responsive padding: `className="px-3 md:px-2"`
   - **Avoid** arbitrary values like `p-6` or inline styles

3. **Component Variants**:
   - SimpleRichEditor must expose `variant` prop for different contexts
   - `variant="default"`: Keeps border, rounded-md, p-4 (for dialogs, modals)
   - `variant="flush"`: Removes internal padding/border (for journal Card)
   - Allows component reuse without hacking around hardcoded styles

4. **Theme Tokens**:
   - Borders: Use `border-border` variable (adapts to theme)
   - Focus rings: Use `ring-ring` variable (adapts to theme)
   - Backgrounds: Use `bg-card` or `bg-background` (adapts to theme)
   - **Test in light, dark, and high-contrast modes**

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Edit mode uses full container width (minimal padding per shadcn scale)
- [ ] Read-only mode matches edit mode spacing
- [ ] Toolbar remains accessible and properly positioned
- [ ] No horizontal overflow at any breakpoint
- [ ] Content doesn't touch absolute edges (some padding remains for readability)
- [ ] Focus states visible and properly styled
- [ ] No layout shift when switching between read/edit modes
- [ ] Mobile (<768px): Adequate touch targets, no cramped text
- [ ] Tablet (768-1279px): Balanced spacing
- [ ] Desktop (≥1280px): Comfortable reading width

**Theme & Design System Testing:**
- [ ] **Light theme**: Verify padding, borders, focus rings use correct shadcn tokens
- [ ] **Dark theme**: Verify padding, borders, focus rings use correct shadcn tokens
- [ ] **High-contrast mode**: Verify surface colors and spacing remain accessible
- [ ] **shadcn Card**: Verify CardContent slot padding is correct (not ad-hoc wrappers)
- [ ] **Focus rings**: No regression in visibility across all themes
- [ ] **Border tokens**: Consistent with shadcn border-border variable

**Visual Regression Testing:**
- Screenshot comparison before/after at multiple breakpoints
- Test with various content lengths (short, medium, long entries)
- Test with formatted content (bold, italic, lists, headings)

---

## Implementation Plan

### Phase 1: Analysis (0.5 day)
1. **Measure current padding**: Use browser DevTools to identify all padding/margin layers
2. **Document container hierarchy**: Map out actual DOM structure in edit/read modes
3. **Identify padding sources**: Determine which CSS classes/inline styles add padding
4. **Screenshot baseline**: Capture current state for comparison

### Phase 2: CSS Refactoring (1 day)
1. **Update globals.css**:
   - Reduce `.rich-editor-body` padding
   - Match `.prose` padding to editor
   - Remove unnecessary container styles
2. **Update SimpleRichEditor.tsx**:
   - Remove inline padding styles if present
   - Simplify className combinations
   - Ensure toolbar positioning intact
3. **Update JournalStream.tsx**:
   - Remove wrapper padding if present
   - Simplify container structure

### Phase 3: Testing & Refinement (0.5 day)
1. **Test all breakpoints**: Mobile, tablet, desktop
2. **Test read/edit modes**: Verify consistency
3. **Test with real content**: Various entry types and lengths
4. **Adjust as needed**: Fine-tune padding values for optimal readability
5. **Screenshot comparison**: Verify improvements

### Phase 4: PR & Review (0.5 day)
1. **Create PR** with before/after screenshots
2. **Document changes** in PR description
3. **Test on Vercel preview**
4. **User approval**

**Total Estimated Time:** 2.5 days

---

## Acceptance Criteria

### Functional Requirements
- ✅ **Measurable padding targets** (shadcn spacing scale):
  - Mobile (<768px): `px-3` (12px horizontal padding)
  - Desktop (≥768px): `px-2` (8px horizontal padding)
  - Previous arbitrary `p-6` (24px) wrappers removed
- ✅ **SimpleRichEditor variant support**:
  - Add `variant="flush"` prop (or `className` escape hatch)
  - Journal uses flush variant (no internal padding/border)
  - Other features can keep default chrome (`variant="default"`)
- ✅ **shadcn Card alignment**:
  - Use `CardContent` component with proper spacing props
  - Remove ad-hoc `p-6` wrappers
  - Padding applied via slot-specific approach (not arbitrary wrappers)
- ✅ Edit mode and read-only mode have consistent padding (using same shadcn tokens)
- ✅ All editor functionality works correctly (formatting, typing, selection)
- ✅ Toolbar remains accessible and properly aligned
- ✅ No horizontal scrolling introduced at any breakpoint

### Visual Requirements
- ✅ Editor content area visually extends to near-edge of container
- ✅ No "container within container" visual appearance
- ✅ Clean, simplified visual hierarchy
- ✅ Focus states clearly visible

### Responsive Requirements
- ✅ Mobile (<768px): Full-width utilization, adequate touch targets
- ✅ Tablet (768-1279px): Balanced spacing, comfortable reading
- ✅ Desktop (≥1280px): Maximum usable width without overwhelming

### Quality Requirements
- ✅ No console errors or warnings
- ✅ Build passes (`npm run build`)
- ✅ Lint passes (`npm run lint`)
- ✅ No accessibility regressions (keyboard nav, focus management, ARIA)
- ✅ No performance degradation

---

## Risks & Mitigation

### Risk 1: Breaking Editor Functionality
**Risk:** Removing containers or changing padding might break contentEditable behavior, cursor positioning, or selection handling.

**Likelihood:** Low
**Impact:** High

**Mitigation:**
1. Test thoroughly in local dev environment before PR
2. Verify all formatting buttons work after changes
3. Test cursor position at start/end of content
4. Test text selection across paragraphs
5. Keep changes minimal and focused on CSS/padding only

**Rollback Plan:** Revert SimpleRichEditor.tsx and globals.css changes

---

### Risk 2: Layout Shift Between Modes
**Risk:** Different padding in read vs edit modes causes jarring layout shift when toggling.

**Likelihood:** Medium
**Impact:** Medium

**Mitigation:**
1. Explicitly match `.prose` and `.rich-editor-body` padding values
2. Test mode switching extensively
3. Use CSS transitions for smooth changes if needed

**Rollback Plan:** Revert to separate padding values if consistency cannot be achieved

---

### Risk 3: Mobile Usability Issues
**Risk:** Reduced padding on mobile might make content too cramped or touch targets too small.

**Likelihood:** Low-Medium
**Impact:** Medium

**Mitigation:**
1. Test on real mobile devices (iOS Safari, Android Chrome)
2. Maintain minimum 8-12px padding even on mobile
3. Verify touch targets for toolbar buttons remain ≥44px
4. Get user feedback on mobile preview

**Rollback Plan:** Use responsive padding (larger on mobile) if needed

---

## Definition of Done

- ✅ All acceptance criteria met
- ✅ Code follows project coding standards (TypeScript strict, 2-space indent)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Builds successfully (`npm run build`)
- ✅ Tested locally with `npm run dev`
- ✅ Before/after screenshots included in PR
- ✅ PR created with detailed description and visual comparison
- ✅ Tested on Vercel preview deployment
- ✅ Manual testing completed on multiple devices/browsers
- ✅ No regression in existing editor functionality
- ✅ User reviews and approves changes
- ✅ User merges PR (not Claude)

---

## Related Issues & Documentation

### GitHub Issues
- **Issue #178**: Reduce nested container padding in journal entry edit mode

### Project Documentation
- **PRD**: `docs/prd.md` - Product requirements
- **CLAUDE.md**: `.claude/CLAUDE.md` - Critical formatting instructions for edit/read modes
- **Tech Stack**: `docs/architecture/tech-stack.md` - Next.js 15.5.3, Tailwind CSS
- **Coding Standards**: `docs/architecture/coding-standards.md` - TypeScript strict, 2-space indent

### Related Components
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor
- `/src/components/journal/JournalStream.tsx` - Journal display
- `/src/utils/sanitizeHtml.ts` - HTML sanitization (reference only, no changes)
- `/src/app/globals.css` - Global styles including editor and prose classes

---

## Codex Review Improvements

The following critical improvements were applied based on Codex code review:

1. **shadcn Card Pattern Enforcement** (Line 47):
   - Explicitly require use of shadcn `Card` and `CardContent` components
   - Remove ad-hoc `p-6` wrappers in favor of slot-specific padding
   - Guide devs to design system patterns instead of hacking around them

2. **SimpleRichEditor Variant Support** (Line 117):
   - Address component's hardcoded `border rounded-md p-4` styles
   - Add `variant` prop or `className` escape hatch for flush rendering
   - Journal uses flush variant, other features keep default chrome
   - Prevents future style conflicts and improves component reusability

3. **Theme Token Testing** (Line 125):
   - Extended checklist to verify light/dark/high-contrast themes
   - Ensure padding, borders, focus rings use correct shadcn tokens
   - Prevent regression in shadcn surface colors and accessibility

4. **Measurable Spacing Targets** (Line 185):
   - Replace vague "50% reduction" with concrete shadcn spacing scale values
   - `px-3` (12px) on mobile, `px-2` (8px) on desktop
   - Reviewers can confirm compliance without guesswork

---

## Notes

### Design Rationale

The nested container padding issue is a common UX problem in rich text editors where defensive styling (padding for safety) accumulates across component boundaries. This story focuses on:

1. **Simplifying visual hierarchy**: Removing unnecessary nesting
2. **Maximizing usable space**: Especially important for mobile/tablet
3. **Maintaining safety**: Keeping minimal padding for readability and touch targets
4. **Consistency**: Aligning read and edit mode spacing

### User Feedback Context

User provided annotated screenshot showing:
- Red arrows pointing to the nested container structure
- Clear visual indication of "wasted space" between containers
- Request to align editor edge with container edge

This feedback indicates the current padding is noticeable enough to impact user experience, particularly during extended writing sessions.

---

**Story Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Actions**:
1. Dev begins Phase 1 (Analysis) - measure current padding
2. Create feature branch: `story-2.13-reduce-editor-padding`
3. Follow PR-based workflow (feature branch, PR, Codex review, Vercel preview, user merges)
