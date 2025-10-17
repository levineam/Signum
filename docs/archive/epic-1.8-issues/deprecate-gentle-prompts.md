# Deprecate "Gentle Prompts" in favor of unified Helper framework

## Summary
Rename the current Gentle Prompt element to Helper, define the long-term Helper framework, and align existing and planned helper experiences under that umbrella so we can fully retire the Gentle Prompt terminology.

## Goals
- Replace the "Gentle Prompt" naming and affordances with a Helper concept that supports multiple journaling methods (e.g., cognitive distortions, feelings wheel, values prompts).
- Audit existing UI copy, components, analytics, and documentation that reference "Gentle Prompt" and update them accordingly.
- Establish a naming and design system pattern for future helper modules.

## Scope
- Identify every reference to "Gentle Prompt" in the app (UI text, component names, analytics events, tests, docs).
- Define the target naming (`Helper`) and update UI copy across surfaces where the element appears.
- Ensure new helper modules (including the CBT distortions helper) live under the same component namespace and share consistent styling.
- Update documentation and onboarding materials to use the new terminology.
- Validate analytics/telemetry event names and create migrations or aliases if needed.

## Acceptance Criteria
- No UI copy or code references to "Gentle Prompt" remain (unless captured in changelog/history).
- Helper element supports multiple helper methods under a unified container, each accessible in the UI.
- Design system tokens/components updated to reflect new naming.
- Analytics dashboards and reporting continue to function after event renames.

## Dependencies / Related Work
- Blocks on the CBT distortions helper issue (#17) to ensure the new helper pattern is in place.
- Coordinate with design/product to finalize Helper naming and iconography.

## References
- CBT distortions helper issue: #17

