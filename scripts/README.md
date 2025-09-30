# Scripts

## Ontology Test Notes Seed Script

### Purpose
This script adds 20 sample notes to localStorage that are specifically designed to test the AI ontology extraction functionality (Story 2.4).

### Content Design
The notes contain rich semantic content including:
- **Values & Beliefs**: Compassion, meaning, justice, personal agency, presence
- **Entities**: People (Sarah Johnson, Marcus Chen, Dr. Priya Patel, Emma), places (Lake Tahoe, community centers), organizations (GreenFuture, Impact Investors Network)
- **Themes**: Work-life balance, parenting, entrepreneurship, community building, personal growth, ethics, health, education
- **Relationships**: Family connections, professional networks, community involvement
- **Life Events**: Career changes, health diagnoses, business failures, learning journeys
- **Philosophical Concepts**: Justice vs. charity, identity beyond work, meaning vs. happiness

### Usage

#### Option 1: Browser Console (Recommended)
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/notes
3. Open browser console (F12 or Cmd+Option+J on Mac)
4. Copy the entire contents of `scripts/seed-ontology-notes.js`
5. Paste into console and press Enter
6. Refresh the page to see the 20 new notes

#### Option 2: Clear and Reseed
If you want to start fresh:
```javascript
// In browser console:
localStorage.removeItem('signum-notes')
// Then run the seed script as above
```

### Verification
After running the script, you should see:
- ✅ Success message in console
- 20 new notes with titles like "On Compassion and Helping Others", "Meeting with Sarah about the Climate Project", etc.
- Notes appear in the "All Notes" section (not in Personal Ontology section)
- Notes are sorted by creation date (newest first)

### Testing Ontology Extraction
These notes are designed to test whether the AI can extract:
1. **Core Values**: What matters to this person? (e.g., compassion, meaning, justice)
2. **Key Relationships**: Who are the important people in their network?
3. **Recurring Themes**: What topics appear repeatedly? (e.g., work-life balance, community)
4. **Beliefs & Mental Models**: How does this person understand the world?
5. **Goals & Aspirations**: What are they working toward?
6. **Tensions & Challenges**: What internal conflicts or struggles appear?

### Notes
- The script preserves existing notes and adds the test notes
- Each note has a unique ID: `ontology-test-{timestamp}`
- Notes are created 1 minute apart to simulate realistic timing
- All notes are type `regular` and not pinned