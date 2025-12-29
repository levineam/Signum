# Writing Spark System Guide

**Last Updated:** 2025-12-28
**Owner:** Engineering
**Story Reference:** PR #227

## Overview

The Writing Spark system provides AI-generated journal prompts based on the user's ontology. It analyzes their values, beliefs, goals, and other ontology sections to generate personalized, warm invitations to write.

## Quick Reference

| Component | Purpose | Location |
|-----------|---------|----------|
| OntologyInsightCard | Displays the spark UI | `/src/components/home/OntologyInsightCard.tsx` |
| useOntologyWritingSpark | Fetches/caches sparks | `/src/hooks/useOntologyWritingSpark.ts` |
| writingSparkAnalysis | Analyzes ontology state | `/src/lib/ontology/writingSparkAnalysis.ts` |
| writing-spark API | OpenAI generation | `/src/app/api/ontology/writing-spark/route.ts` |
| HomepagePrimer | Container layout | `/src/components/home/HomepagePrimer.tsx` |
| RightPanel | Desktop widget panel | `/src/components/layout/RightPanel.tsx` |

## Architecture

```
User loads homepage
       │
       ▼
┌─────────────────────────────┐
│  useOntologyWritingSpark    │
│  1. Check sessionStorage    │
│  2. If cached, use it       │
│  3. Else fetch pinned notes │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ analyzeOntologyForWritingSpark│
│ - Walk sections in order     │
│ - Find empty/stale/healthy   │
│ - Return focus + signal      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  POST /api/ontology/writing-spark │
│  - Receive focus + signal   │
│  - Generate prompt via OpenAI│
│  - Return warm invitation   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  OntologyInsightCard        │
│  - Display spark text       │
│  - On click: dispatch event │
│  - Dismiss: sessionStorage  │
└─────────────────────────────┘
```

## Guiding Principles

The system follows strict UX guidelines to ensure prompts feel inviting, not demanding.

### Do (Invitation, not instruction)

- Questions, not statements
- Warm, not clinical
- Writing-focused (inspire journaling)
- Magical, not mechanical

### Don't (Anti-patterns)

- "Your X section is empty/incomplete"
- "You should update your Y"
- "Before doing Z, first do W"
- "It's been N days since you..."
- Any language implying tasks, gaps, or deficiencies

## Integration Points

### Journal Seeding Event

When user clicks the OntologyInsightCard, it dispatches:

```typescript
window.dispatchEvent(
  new CustomEvent('seed-journal-entry', {
    detail: { text: sparkText },
  })
)
```

JournalStream listens for this event and pre-fills the editor with the spark text.

### Caching Strategy

| Key | Storage | Behavior |
|-----|---------|----------|
| `signum-writing-spark-v1` | sessionStorage | One spark per session (avoids API spam) |
| `signum-ontology-insight-dismissed-session` | sessionStorage | Card hidden for current session |

## Responsive Layout

| Viewport | OntologyInsightCard | Reminders/Todos Widgets |
|----------|---------------------|-------------------------|
| Desktop (>=1024px) | Above journal | Right panel (RightPanel.tsx) |
| Tablet/Mobile (<1024px) | Above journal | Below insight, above journal |

### Layout Components

- **HomepagePrimer** - Contains OntologyInsightCard; conditionally renders widgets on mobile
- **RightPanel** - Fixed right-side panel (320px) containing widgets on desktop
- **page.tsx** - Coordinates layout with `lg:pr-80` padding for right panel

## Styling

The OntologyInsightCard uses `.ontology-insight-gold` class (in globals.css):

- Subtle gradient background
- Gold border color
- Hover sheen animation
- Dark mode variant

## Troubleshooting

### Spark not loading

1. Check browser console for API errors
2. Verify `OPENAI_API_KEY` in environment
3. Check if user has any pinned ontology notes
4. Clear sessionStorage and refresh

### Spark shows fallback text

The fallback is intentionally high-quality:

> "What's been feeling important to you lately? Sometimes our priorities shift in ways we don't fully notice until we pause to reflect."

This appears when:
- API call fails
- No Supabase connection
- User not authenticated

### Card not dismissing

- Check sessionStorage access (private browsing may block)
- Verify `DISMISS_KEY` matches between reads/writes

### Widgets not in right panel on desktop

1. Verify viewport width is >=1024px
2. Check `useMediaQuery` hook is working
3. Verify RightPanel component is rendered in page.tsx

### Main content overlapping right panel

- Ensure `lg:pr-80` is on the main element in page.tsx
- Verify RightPanel has `fixed right-0` positioning

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/components/home/OntologyInsightCard.tsx` | Main UI component |
| `/src/components/home/HomepagePrimer.tsx` | Layout container with responsive logic |
| `/src/components/home/DailyRemindersPrimer.tsx` | Reminders widget |
| `/src/components/home/TodosPrimer.tsx` | Todos widget |
| `/src/components/layout/RightPanel.tsx` | Desktop right-side panel |
| `/src/hooks/useOntologyWritingSpark.ts` | Data fetching hook |
| `/src/hooks/useMediaQuery.ts` | Responsive breakpoint detection |
| `/src/lib/ontology/writingSparkAnalysis.ts` | Ontology analysis |
| `/src/app/api/ontology/writing-spark/route.ts` | API endpoint |
| `/src/app/page.tsx` | Homepage layout coordination |
| `/src/app/globals.css` | Gold card styling |

## References

- PR #227: Initial implementation
- [Ontology Incremental Analysis](./ontology-incremental.md)
- [Local Testing Guide](./local-testing-guide.md)
