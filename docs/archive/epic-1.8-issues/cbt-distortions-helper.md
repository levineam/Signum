# Add "Cognitive Distortions" helper under Gentle Prompt (first step toward deprecating Gentle Prompts)

## Summary
Add a new helper row beneath the existing Gentle Prompt element that helps users reflect using CBT cognitive distortions. This is the first step toward a broader Helper concept and eventual deprecation/renaming of Gentle Prompts.

## Goal
Help users journal by quickly identifying cognitive distortions they experienced and generate structured starter text in their entry.

## UX Behavior
- Placement: Below the existing Gentle Prompt element (same container/block).
- Row copy: "What cognitive distortions might you have experienced today?"
- Explore button: Expands an inline panel below this row while keeping the original row text visible.
- Expanded panel: Displays a list of cognitive distortions with:
  - Name
  - Brief description
  - One short example
  - A checkbox per item
- Optional "Clear" control to deselect all distortions without collapsing.
- Continue button: Appends selected distortions into the current journal entry at the end of the document in this format:
  - For each selected distortion, insert a new paragraph: "Today I experienced {Distortion}. Here's what happened: ..."
  - After insertion, leave focus in the editor (cursor placed after the appended text).
- Collapse behavior: After Continue, collapse the panel, clear selections, and announce completion for assistive tech.

## Accessibility
- Explore button toggles `aria-expanded`, references the panel via `aria-controls`, and is keyboard operable.
- Each checkbox has an accessible label (name + short description) and participates in the tab order.
- On expand, move focus to the first checkbox; on collapse/Continue, return focus to the Explore button.
- Announce successful insertion via an `aria-live="polite"` region so screen reader users know the helper wrote to their entry.

## Data Model (static for v1)
Create a simple data source for distortions `(id, label, description, example)`.
Proposed location: `signum-app/src/data/cbtDistortions.ts`

### Cognitive distortions and examples
| Distortion | Description | Example |
| --- | --- | --- |
| All-or-Nothing Thinking | Viewing situations in black-and-white categories without middle ground. | "I missed one gym day; I'm off track forever." |
| Overgeneralization | Assuming a single event will always repeat. | "One rejection means I'll never get hired." |
| Mental Filter | Dwelling on a single negative detail. | "Ignoring nine positives, fixating on one critique." |
| Discounting the Positive | Rejecting positive experiences by insisting they "don't count." | "They were just being nice; it doesn't count." |
| Jumping to Conclusions (Mind Reading / Fortune Telling) | Presuming outcomes or others' thoughts without evidence. | "They didn't reply; they must be mad." |
| Magnification / Minimization (Catastrophizing) | Exaggerating negatives or shrinking positives. | "A small mistake will ruin everything." |
| Emotional Reasoning | Believing feelings prove facts. | "I feel guilty, so I must have done wrong." |
| Should Statements | Using rigid rules about how you or others must act. | "I should always be productive." |
| Labeling | Assigning global labels to self or others. | "I'm a loser." |
| Personalization / Blame | Taking responsibility for events outside your control. | "It's my fault they're upset." |

## Suggested Implementation
- UI components:
  - New component: `signum-app/src/components/Helper/CbtDistortions.tsx`
  - Data: `signum-app/src/data/cbtDistortions.ts`
  - Integrate into the existing journaling screen where the Gentle Prompt element is rendered (component name/path TBD).
- State/Insertion:
  - Keep selection local to the panel; on Continue, call the existing journal editor API to append paragraphs at the end of the active entry.
- Telemetry (optional for v1):
  - Log `helper_opened`, `distortions_selected`, and `helper_inserted` events.

## Acceptance Criteria
- Explore expands/collapses inline, preserving the "What cognitive distortions..." prompt text.
- Distortion list shows the name, short description/example, and a checkbox for each distortion in the table above.
- Continue inserts one paragraph per selected distortion: "Today I experienced {Distortion}. Here's what happened: ..."
- Appended text is plain paragraphs (no markdown bullets) and respects the editor's undo/redo behavior.
- No console errors; passes lint.
- Accessible labels for checkboxes; keyboard operation works for Explore/Clear/Continue.
- Visuals match existing styles for the Gentle Prompt element and surrounding UI.

## Out of Scope
- Persisting distortions historically or analytics dashboarding.
- Personalization or reordering distortions.
- Renaming the Gentle Prompt element (handled in follow-up issue #18).

## Follow-ups
- Deprecate Gentle Prompts and migrate to the unified Helper framework (issue #18).
- Consider additional helper methods (e.g., feelings wheel, values prompts, reflection templates).

## References
- CBT distortions table from client-provided screenshot (content reflected above).
- Follow-up issue: https://github.com/levineam/Signum/issues/18
