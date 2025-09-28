# Signum Product Requirements Document (PRD)

**Date:** September 27, 2025
**Status:** In Progress
**Version:** 2.5 (Personal Ontology Priority)

## Goals and Background Context

### Goals

• Create a stable, delightful journaling-first social platform that captures the core vision of meaning-making
• Validate that AI-driven ontology building provides tangible value to users seeking self-understanding
• Establish a robust cloud-native application suitable for daily use without data loss or significant bugs
• Enable frictionless journal capture with seamless cloud storage and WYSIWYG editing experience
• Build a meaningful social layer connecting personal insights to community through shared values
• Implement a working Karma system that rewards insightful contributions and validates social engagement

### Background Context

Signum addresses a significant gap in the digital landscape where current platforms optimize for external metrics rather than personal insight and meaning-making. The journaling and social media ecosystem lacks a dedicated tool that bridges private self-reflection with meaningful social connection based on shared values.

The solution combines two key innovations: gentle background AI that builds personal ontologies from journal entries, and an integrated social layer that connects users through their core values and beliefs. This creates a unique positioning as a "journaling-first social platform" rather than another productivity or entertainment-focused application.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-27 | 2.5 | Course correction: Prioritizing Personal Ontology (Epic 4) over Epic 2 remaining stories. Story 2.3 (Hyperlink Creation) completed. Expanding sample data to 20 entries for AI testing | John (PM) |
| 2025-09-26 | 2.4 | Story 2.2 completed - Note Creation from Highlighted Text implemented with modal interface and duplicate prevention consideration | John (PM) |
| 2025-09-25 | 2.3 | Story 2.1 completed - Text Selection & Make Note Interface implemented with toolbar approach | John (PM) |
| 2025-09-25 | 2.2 | Story 2.0 completed - Rich Text Formatting Toolbar implemented with comprehensive options | John (PM) |
| 2025-09-25 | 2.1 | Story 1.7 completed - Gentle Prompts System implemented with enhancements | John (PM) |
| 2025-09-19 | 2.0 | Greenfield PRD creation from updated project brief | John (PM) |
| 2025-09-12 | 1.0 | Original PRD (deprecated - brownfield approach) | Previous |

## Requirements

### Functional Requirements

**FR1:** Users can create and edit journal entries using a WYSIWYG editor with rich text formatting capabilities

**FR2:** Users can highlight text within journal entries and create linked notes through an intuitive "Make Note" popup interface

**FR3:** The system automatically creates bidirectional links between journal entries and notes when users create notes from highlighted text

**FR4:** Users can navigate between linked notes and journal entries through clickable hyperlinks in the text

**FR5:** The system maintains a graph database of connections between all notes and journal entries

**FR6:** Users can publish any journal entry as a social post with a single click action

**FR7:** Users can view a chronological social feed displaying posts from other users

**FR8:** Users can award Karma points to other users' posts through a simple interaction

**FR9:** Users can view their own and others' Karma totals on user profiles

**FR10:** The AI system analyzes journal entries to extract candidate Values, Beliefs, and Aims for user confirmation

**FR11:** Users can review and approve/reject AI-suggested ontology additions to their personal profile

**FR12:** All user data (journal entries, notes, posts, Karma transactions) is automatically saved to cloud storage

**FR13:** Users can authenticate securely and access their data from any web browser

**FR14:** Users can view their complete journal history in chronological order

**FR15:** Users can subscribe to acquire additional Karma points to award to others

**FR16:** Users see contextual, rotating ACT-inspired prompts when starting new journal entries to guide reflection and improve input quality for AI analysis

### Non-Functional Requirements

**NFR1:** The application must provide sub-2-second response times for journal entry creation and editing

**NFR2:** Cloud data storage must ensure 99.9% uptime with automatic backups and disaster recovery

**NFR3:** User authentication and data access must be secured using Row-Level Security (RLS) policies

**NFR4:** The application must be responsive and functional across modern web browsers (Chrome, Firefox, Safari, Edge)

**NFR5:** The system must handle concurrent users without data corruption or performance degradation

**NFR6:** AI processing of journal entries must occur asynchronously without blocking user interactions

**NFR7:** The application must be deployable on Vercel with Supabase as the backend service

**NFR8:** Data privacy must be enforced at the database level with user isolation

**NFR9:** The user interface must provide a "calm and frictionless" experience prioritizing simplicity

**NFR10:** The system must operate within free/low-cost service tiers during MVP development phase

## User Interface Design Goals

### Overall UX Vision

Signum embodies a "calm and frictionless" design philosophy that prioritizes meaning-making over productivity metrics. The interface should feel like a peaceful sanctuary for thought - similar to opening a well-crafted notebook, but with the intelligence and connectivity of modern technology. Users should experience immediate entry into a flow state upon opening the app, with the journal editor taking center stage and all other features accessible but never intrusive.

### Key Interaction Paradigms

**Primary Interaction: Immediate Writing** - The app opens directly to a new journal entry with cursor ready, eliminating any barriers to capturing thoughts.

**Progressive Disclosure** - Advanced features (AI suggestions, social feed, note linking) are discoverable but don't overwhelm the core writing experience.

**Contextual Intelligence** - The "Make Note" functionality appears naturally when text is highlighted, and AI suggestions surface gently without interrupting flow.

**One-Click Social** - Publishing to the social feed requires minimal friction while maintaining intentionality.

### Core Screens and Views

**Journal Stream (Primary Interface)** - A chronological feed of all journal entries with today's new blank entry at the top. Users see their entire thought history at a glance and can immediately start typing in the new entry or click any past entry to edit it inline. This unified read/write interface eliminates friction between reviewing past thoughts and continuing them.

**Social Feed** - Clean, distraction-free stream of posts from other users with integrated Karma awarding

**Personal Notes Library** - Organized view of all created notes with visual connection indicators

**Personal Ontology Dashboard** - Space to review and manage AI-suggested Values, Beliefs, and Aims

**User Profile** - Simple profile showing Karma totals and basic user information

### Accessibility: WCAG AA

The application will meet WCAG AA standards to ensure accessibility for users with disabilities, supporting screen readers, keyboard navigation, and appropriate color contrast ratios.

### Branding

The visual design should evoke calm, thoughtfulness, and authenticity. Consider a palette inspired by natural materials (warm whites, soft grays, muted earth tones) with typography that feels both modern and timeless. The overall aesthetic should signal "this is a place for deep thought" rather than "this is a productivity tool."

### Target Device and Platforms: Web Responsive

MVP will focus on web responsive design optimized for desktop and tablet use, with mobile usability but not mobile-first optimization. The writing experience should feel natural on larger screens where extended journaling is most comfortable.

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing both frontend and backend code, configuration, and documentation to simplify development and deployment coordination for a solo developer with AI assistance.

### Service Architecture

**Cloud-First Monolith**: A single Next.js application deployed on Vercel with Supabase providing backend-as-a-service (BaaS) capabilities. This architecture prioritizes rapid development and leverages managed services to minimize operational complexity while maintaining the ability to scale individual components as needed.

**Key Architectural Decisions:**
- **Frontend**: Next.js 14+ with React for the web application
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage) as complete BaaS
- **Deployment**: Vercel for frontend hosting with automatic deployments
- **Authentication**: Supabase Auth with Row-Level Security (RLS) for data isolation
- **Real-time Features**: Supabase Realtime for live social feed updates

### Testing Requirements

**Unit + Integration Testing**: Comprehensive testing strategy including unit tests for business logic, integration tests for database operations and API endpoints, and end-to-end tests for critical user journeys (journaling flow, note creation, social interactions).

**Testing Stack:**
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright for browser automation
- **Database**: Supabase local development environment for testing isolation

### Additional Technical Assumptions and Requests

**AI Integration**: OpenAI API (GPT-4) for natural language processing and ontology extraction from journal entries, with graceful degradation when API limits are reached

**Rich Text Editing**: Lexical editor (by Meta) for WYSIWYG journal editing with JSON-native storage, superior text selection APIs for the "Make Note" feature, and lightweight performance for smooth scrolling through many entries

**UI Component Library**: shadcn/ui with the Notebook theme (`npx shadcn@latest add https://tweakcn.com/r/themes/notebook.json`) to provide a cohesive design system that aligns with the calm, thoughtful aesthetic required for the journaling experience

**Data Storage Strategy**: PostgreSQL schemas optimized for journaling workflows with proper indexing for chronological queries and full-text search capabilities

**Performance Optimization**: Implement virtual scrolling for the journal stream interface to handle large numbers of entries efficiently

**Security Posture**: Implement Content Security Policy (CSP), HTTPS everywhere, and secure session management through Supabase Auth

**Development Constraints**: Must operate within free/low-cost service tiers during MVP phase, requiring careful monitoring of API usage and database storage limits

## Epic List

**Epic 1: Clean Slate & Fresh Foundation**
Remove all legacy code and documentation from previous brownfield attempts, then establish a clean greenfield foundation with proper project infrastructure.

**Epic 2: Intelligent Note Linking & Knowledge Graph**
Implement the intuitive "Make Note" functionality, bidirectional linking system, and knowledge graph foundation that connects journal entries and notes.

**Epic 3: Feedback-First Social Layer & Basic Karma**
Create the collapsible sidebar navigation (Journal, Notes, Feedback, Articles, Meets, Karma) with the Feedback feature as a Twitter-like feed optimized for app feedback and community building, plus basic Karma point system for rewarding feedback contributions.

**Epic 4: AI-Powered Personal Ontology & Enhanced Feedback**
Build the background AI processing for personal ontology (Values, Beliefs, Aims) while enhancing the Feedback system to support more diverse community discussions beyond just app feedback.

**Epic 5: Articles Foundation & Cross-Feature Integration**
Implement basic Articles functionality (converting notes to publishable content) and establish the foundation for cross-feature integration where journal insights can flow into feedback posts, notes can become articles, and karma rewards meaningful contributions across all features.

## Epic Details

### Epic 1: Clean Slate & Fresh Foundation

**Epic Goal:** Remove all legacy code and documentation from the previous brownfield development attempts, then establish a clean greenfield foundation with proper project infrastructure. Users will have a completely fresh starting point that eliminates any technical debt or architectural compromises from previous iterations.

#### Story 1.1: Legacy Cleanup & Project Reset

As a developer,
I want to remove all existing application code and documentation except the project brief,
so that I can start with a truly clean slate without any legacy interference.

##### Acceptance Criteria
1. All files in `/signum-app/` directory are deleted except `.git` if preserving git history
2. All documentation in `/docs/` is removed except `project-brief.md` and this new `prd.md`
3. Legacy PRD, architecture documents, and story files are completely removed
4. Any existing deployment artifacts or build outputs are cleaned up
5. Working directory is verified to contain only the preserved project brief and new PRD
6. Git history is optionally reset or cleaned to remove legacy commits
7. Fresh directory structure is confirmed before proceeding to new development

#### Story 1.2: Clean Project Foundation & Development Environment

As a developer,
I want a properly configured Next.js project with Supabase integration and the shadcn Notebook theme,
so that I can build upon a completely fresh foundation with no legacy code interference.

##### Acceptance Criteria
1. Fresh Next.js 14+ project is initialized in clean directory with TypeScript
2. New Supabase project is created and configured with local development environment
3. shadcn/ui is installed with the Notebook theme (`npx shadcn@latest add https://tweakcn.com/r/themes/notebook.json`)
4. Lexical editor dependencies are installed and configured from scratch
5. Clean environment variables are configured for local and production deployments
6. Fresh Vercel deployment pipeline is established with automatic deployments
7. Basic health check route confirms clean foundation is working

#### Story 1.3: User Authentication & Security Foundation

As a potential user,
I want to securely create an account and log in to a completely fresh application,
so that my journal entries are private and built on clean, secure infrastructure.

##### Acceptance Criteria
1. Fresh Supabase Auth integration with email/password signup and login
2. Clean user session management without any legacy authentication artifacts
3. Password reset functionality implemented from scratch
4. Fresh Row-Level Security (RLS) policies with no legacy security concerns
5. Clean authentication state management across page refreshes
6. Proper routing protection for unauthenticated users
7. Security implementation verified to have no legacy vulnerabilities

#### Story 1.4: Clean Database Schema & Data Models

As a developer,
I want a fresh database schema designed specifically for the new architecture,
so that there are no legacy data model constraints affecting the new implementation.

##### Acceptance Criteria
1. Fresh database schema designed from project brief requirements
2. Clean users table with only necessary profile information
3. Journal entries table with proper indexing optimized for the journal stream interface
4. Notes table designed specifically for the new note-linking functionality
5. Database relationships properly established without legacy artifacts
6. Fresh migration system with clean version history
7. Database confirmed to be free of any legacy data or schema elements

#### Story 1.5: Fresh Journal Stream Interface

As a user,
I want a completely new journal stream interface built from the ground up,
so that I experience the true vision without any legacy UI compromises.

##### Acceptance Criteria
1. Brand new journal stream interface displaying entries in reverse chronological order
2. Clean implementation of today's blank entry at the top
3. Fresh UI components using only the shadcn Notebook theme
4. Interface built specifically for the unified read/write experience
5. Performance optimized from the start without legacy technical debt
6. Clean responsive design with no legacy CSS or component interference
7. Loading and error states implemented fresh without legacy patterns

#### Story 1.6: Fresh WYSIWYG Editor & Cloud Persistence

As a user,
I want a clean rich text editing experience with reliable cloud storage,
so that I can write without any legacy editor issues or data persistence concerns.

##### Acceptance Criteria
1. Fresh Lexical editor implementation with clean configuration
2. Auto-save functionality built from scratch with proper error handling
3. Clean Supabase data persistence without any legacy data artifacts
4. Fresh optimistic updates and data synchronization
5. Clean entry timestamp management and data integrity
6. Error handling implemented without legacy workarounds
7. Save status feedback designed fresh for the new user experience

#### Story 1.7: Gentle Prompts System for Quality Journal Input ✅ COMPLETED

As a reflective journaler,
I want to see thoughtful, rotating prompts when I start a new journal entry,
so that I can begin with intention and provide higher quality input for future AI analysis.

##### Acceptance Criteria (IMPLEMENTED)
1. ~~When a user creates a new, blank journal entry, a prompt from the ACT-inspired prompt list is displayed as enhanced placeholder text~~ **ENHANCED:** Dedicated prompt element above journal entries with amber gradient styling ✅
2. ~~The prompt disappears immediately when the user begins typing any character~~ **ENHANCED:** Manual dismiss with X button, stays visible while typing ✅
3. A small dismiss button (X) allows manual prompt removal without typing ✅
4. Each new entry shows a different prompt, rotating through available prompts sequentially ✅
5. Prompt rotation state is maintained in localStorage to avoid repetition until full cycle completion ✅
6. Prompts are visually distinct from user text (lighter color, italicized styling) **ENHANCED:** Amber gradient card with elegant typography ✅
7. System includes 12 ACT-inspired prompts covering Values, Mindfulness, Committed Action, and Cognitive Defusion themes ✅

##### Implementation Enhancements
- **Dedicated UI Element**: Instead of placeholder text, prompts appear as a visually distinct card above journal entries
- **Refresh Functionality**: Circular arrow icon allows users to cycle to next prompt without dismissing
- **Session-Based Dismissal**: Prompts reappear with new rotation on each page refresh
- **Enhanced Visual Design**: Amber gradient background with sophisticated typography following shadcn Notebook theme
- **Improved UX**: Prompts remain visible while writing to provide ongoing inspiration

##### Technical Implementation
- **Location**: `/src/components/journal/JournalStream.tsx` (prompt element)
- **Utilities**: `/src/utils/journalPrompts.ts` (rotation logic, storage management)
- **Storage**: localStorage for rotation state, sessionStorage for dismissal (cleared on page load)
- **Icons**: Lucide React (RefreshCw, X icons)

### Epic 2: Intelligent Note Linking & Knowledge Graph

**Epic Goal:** Implement rich text formatting controls and the intuitive "Make Note" functionality that allows users to highlight formatted text in journal entries and seamlessly create linked notes. Establish the bidirectional linking system and knowledge graph foundation that transforms isolated thoughts into a connected knowledge base, enabling users to build meaningful relationships between their ideas over time.

#### Story 2.0: Rich Text Formatting Toolbar ✅ COMPLETED

As a journaler,
I want rich text formatting controls (bold, italic, underline, lists, headings) with active state indicators,
so that I can create well-formatted journal entries and notes that are visually expressive and professional.

##### Acceptance Criteria (IMPLEMENTED)
1. ~~Implement shadcn-editor as replacement for current plain text JournalEditor~~ **ENHANCED:** Built custom SimpleRichEditor with native contentEditable for stability ✅
2. Toolbar displays formatting controls: Bold (B), Italic (I), Underline (U), Bullet Lists, Headings (H1-H3) **ENHANCED:** 11 formatting options organized in groups ✅
3. ~~Toggle buttons show active state when formatting is applied to selected text~~ **FUTURE:** Active states to be implemented in next iteration
4. ~~Active state indicators update dynamically as user changes text selection~~ **FUTURE:** Dynamic updates to be implemented in next iteration
5. ~~Formatting commands work via keyboard shortcuts (Ctrl/Cmd+B for bold, etc.)~~ **FUTURE:** Keyboard shortcuts to be implemented in next iteration
6. Formatted content is properly serialized and stored in database ✅
7. Toolbar integrates seamlessly with shadcn/ui Notebook theme styling ✅
8. Maintains existing auto-save functionality from current editor ✅
9. Preserves existing prompt system integration ✅
10. Works consistently across journal entries and future note creation ✅

##### Implementation Enhancements
- **Comprehensive Toolbar**: 11 formatting options organized into logical groups:
  - **Text Formatting**: Bold, Italic, Underline
  - **Headings**: Heading 1, Heading 2
  - **Lists**: Bullet List, Numbered List
  - **Alignment**: Align Left, Align Center, Align Right
  - **Quote/Indent**: Quote/Indent functionality
- **Stable Architecture**: Used native `contentEditable` with `document.execCommand` instead of problematic Lexical dependencies
- **Auto-Save Integration**: Maintains 2-second debounced auto-save with proper change detection
- **Responsive Design**: Toolbar groups with proper spacing and mobile-friendly layout

##### Technical Implementation
- **Component**: `/src/components/editor/SimpleRichEditor.tsx` (replaces JournalEditor)
- **Integration**: Updated `/src/components/journal/JournalStream.tsx` to use SimpleRichEditor
- **API**: Native DOM APIs (`document.execCommand`, `window.getSelection`, `document.createElement`)
- **Styling**: shadcn/ui Button components with Notebook theme styling
- **Auto-Save**: React hooks (useRef, useCallback, useEffect) with proper debouncing

#### Story 2.1: Text Selection & "Make Note" Interface ✅ COMPLETED

As a user,
I want to highlight any formatted text in my journal entries and see a "Make Note" popup,
so that I can easily create separate notes from my formatted journal thoughts.

##### Acceptance Criteria (IMPLEMENTED)
1. ~~Text selection in shadcn-editor triggers a contextual popup with "Make Note" option~~ **ADAPTED:** Toolbar-based "Make Note" button appears when text is selected ✅
2. ~~Popup appears positioned near the selected text without covering content~~ **ADAPTED:** Toolbar integration provides consistent positioning ✅
3. "Make Note" button is clearly labeled and accessible via keyboard navigation ✅
4. ~~Popup dismisses when clicking elsewhere or pressing Escape key~~ **ADAPTED:** Button state clears when selection is lost ✅
5. Selected text (including formatting) is visually highlighted while toolbar is active ✅
6. ~~Popup works consistently across all text formatting types~~ **ADAPTED:** Toolbar works with all formatted text selections ✅
7. Selected formatted text maintains its styling when converted to note title ✅
8. ~~Mobile touch interface properly supports text selection and popup interaction~~ **ADAPTED:** Toolbar approach provides better mobile experience ✅

##### Implementation Approach
- **Toolbar Integration**: Instead of a floating popup, "Make Note" functionality was integrated into the existing rich text toolbar for better UX consistency
- **Selection Detection**: Uses native `window.getSelection()` API to detect text selection and show/hide the Make Note button
- **Visual Feedback**: Clear visual indication when Make Note button is available and active
- **Consistent Experience**: Unified with existing formatting toolbar for intuitive user experience

##### Technical Implementation
- **Component**: Enhanced `/src/components/editor/SimpleRichEditor.tsx` with selection detection
- **Button Logic**: Make Note button appears in toolbar when text is selected, disappears when selection is cleared
- **Selection Handling**: Native browser selection APIs for reliable cross-browser compatibility
- **Integration**: Seamless integration with existing toolbar styling and shadcn/ui components

#### Story 2.2: Note Creation from Highlighted Text ✅ COMPLETED

As a user,
I want the highlighted text to become the title of a new note when I click "Make Note",
so that my note creation process feels natural and efficient.

##### Acceptance Criteria (IMPLEMENTED)
1. Clicking "Make Note" creates a new note with highlighted text as the title ✅
2. New note opens in a modal or side panel with Lexical editor ready for content ✅
3. User can immediately start typing content in the new note ✅
4. Note creation process includes proper timestamps and user association ✅
5. Empty notes can be saved and are properly stored in the database ✅
6. Note creation works with multi-word and phrase selections ✅
7. Special characters and formatting in highlighted text are handled correctly ✅

##### Implementation Details
- **Modal Interface**: Clean modal dialog opens when "Make Note" is clicked from selected text
- **Rich Text Editor**: Note content editor uses the same SimpleRichEditor component for consistency
- **Database Integration**: New notes table with proper relationships to users and source journal entries
- **Auto-Save**: Note content is automatically saved with 2-second debouncing for smooth editing experience
- **User Experience**: Modal can be dismissed via X button or Escape key, with unsaved changes preserved

##### Technical Implementation
- **Component**: `/src/components/notes/CreateNoteModal.tsx` (new modal component)
- **Database**: `notes` table with `id`, `title`, `content`, `user_id`, `created_at`, `updated_at` fields
- **API**: Supabase integration for note creation and content persistence
- **Editor**: Reused SimpleRichEditor component for consistent formatting capabilities

##### Future Enhancement Identified
- **Duplicate Note Prevention**: Currently, users can create multiple notes with identical titles. Consider implementing:
  - Warning when creating notes with existing titles
  - Suggestion to append to existing note instead of creating duplicate
  - Search functionality to find existing notes before creation
  - Automatic title variation (e.g., "Stoicism (2)", "Stoicism (3)") for true duplicates

#### Story 2.3: Automatic Hyperlink Creation in Journal Entry ✅ COMPLETED

As a user,
I want the highlighted text in my journal entry to automatically become a clickable link to the new note,
so that I can easily navigate between connected thoughts.

##### Acceptance Criteria (IMPLEMENTED)
1. Original highlighted text is automatically converted to a hyperlink after note creation ✅
2. Hyperlink visually distinguishes linked text from regular text using consistent styling ✅
3. Clicking the hyperlink opens the associated note for viewing/editing ✅
4. Hyperlink maintains proper formatting context within the journal entry ✅
5. Link creation is immediately visible without requiring page refresh ✅
6. Multiple links within a single journal entry work independently ✅
7. Link styling follows the shadcn Notebook theme design principles ✅

##### Implementation Details
- **Content Storage**: Modified `SimpleRichEditor` to store HTML content instead of plain text
- **Non-Editing View**: Enhanced read-only display to render HTML content with link click handling
- **Link Restoration**: Improved `restoreLinksInEditor` function to handle existing links properly
- **Event Handling**: Fixed link click handlers in both editing and non-editing modes
- **NoteViewer**: Updated to properly display HTML content

##### Testing Completed
- **Manual Test**: Created note from highlighted "contentment" text - hyperlinks work correctly ✅
- **Editing Mode**: Links are clickable and functional when editing journal entries ✅
- **Viewing Mode**: Links are properly displayed and clickable in read-only mode ✅
- **Persistence**: Links survive page refresh and editing session changes ✅
- **Multiple Links**: Multiple links in same entry work independently ✅
- **Playwright Test**: Comprehensive automated test verifies all functionality ✅

##### Technical Implementation
- **Components**:
  - Link creation logic in `/src/components/journal/JournalStream.tsx:108-125`
  - HTML content display in read-only mode with click handling (lines 271-285)
  - NoteViewer updated to render HTML content properly
- **Editor**:
  - `/src/components/editor/SimpleRichEditor.tsx` modified to work with HTML content
  - Content persistence via `innerHTML` instead of `innerText`
- **Utilities**:
  - `/src/utils/textToLink.ts` (convertTextToLink, restoreLinksInEditor functions)
  - Improved event listener management and link detection
- **Storage**: `/src/lib/links.ts` (bidirectional link relationship tracking)
- **Types**: Complete link and note relationship type definitions

#### Story 2.4: Personal Ontology Extraction Foundation 🚧 PRIORITIZED - IN PROGRESS

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from my journal entries,
so that I can build a structured personal ontology that helps me understand my authentic self and track my philosophical evolution over time.

##### Acceptance Criteria

**Core Functionality:**
1. ✅ System analyzes journal entries using OpenAI GPT-5 to extract philosophical concepts
2. ✅ Extracted concepts are automatically categorized as:
   - **Values**: Core principles that guide decisions (e.g., "integrity", "independence", "compassion")
   - **Beliefs**: Fundamental truths about the world (e.g., "happiness is a choice", "people are inherently good")
   - **Aims**: Life goals and aspirations (e.g., "cultivate mindfulness", "build meaningful relationships")
3. ✅ Each extraction includes:
   - Confidence score (high/medium/low based on clarity and context)
   - Source attribution (which journal entry, specific quote)
   - Extraction timestamp
   - AI reasoning for categorization
4. ✅ Minimum entry length of 100 words required for meaningful extraction
5. ✅ System processes up to 3 entries per analysis batch to manage API costs

**User Interface Requirements:**
1. ✅ New "Ontology" section added to sidebar navigation (icon: Brain or Sparkles)
2. ✅ Suggestion cards display:
   - Extracted concept text (e.g., "Independence and self-determination")
   - Category badge (Value/Belief/Aim) with color coding
   - Confidence indicator (★★★ for high, ★★ for medium, ★ for low)
   - Source preview (first 100 chars of journal entry)
   - Action buttons: Approve, Edit, Reject, View Source
3. ✅ Approved ontology dashboard shows:
   - Three columns for Values, Beliefs, and Aims
   - Count badges for each category
   - Timeline view showing when concepts were added
   - Search/filter functionality
4. ✅ Visual feedback during AI processing (loading spinner, progress indicator)
5. ✅ Empty state with helpful onboarding when no ontology items exist

**Data Management:**
1. ✅ LocalStorage schema:
   ```typescript
   interface OntologySuggestion {
     id: string
     type: 'value' | 'belief' | 'aim'
     text: string
     confidence: 'high' | 'medium' | 'low'
     sourceEntryId: string
     sourceQuote: string
     extractedAt: string
     aiReasoning: string
     status: 'pending' | 'approved' | 'rejected' | 'edited'
     editedText?: string
     reviewedAt?: string
   }
   ```
2. ✅ Duplicate detection prevents suggesting already approved/rejected concepts
3. ✅ Maximum 10 pending suggestions shown at once (FIFO queue)
4. ✅ Export functionality for backup (JSON format)

**API Integration:**
1. ✅ OpenAI API key stored securely in environment variables (server-side only)
2. ✅ Rate limiting: Maximum 10 API calls per day per user
3. ✅ Graceful degradation when API unavailable or limits reached
4. ✅ API Security:
   - Never expose API keys in frontend code
   - Use Next.js API routes for all OpenAI calls
   - Validate and sanitize all inputs before API calls
   - Implement proper error handling for API failures
5. ✅ Model configuration:
   - Model: `gpt-5` for best performance and reasoning capabilities
   - Use Responses API for optimal chain-of-thought processing
   - Reasoning effort: `medium` for balanced performance and quality
   - Verbosity: `medium` for detailed but concise explanations
   - Note: temperature, top_p, logprobs NOT supported in GPT-5
6. ✅ Prompt template optimized for philosophical extraction:
   ```
   System: You are an expert at analyzing journal entries to extract personal values, beliefs, and aims.
   Extract and categorize insights into three categories:
   - Values: Core principles that guide decisions
   - Beliefs: Fundamental truths the person holds
   - Aims: Goals and aspirations

   Return as structured JSON with extracted concepts, confidence scores, and reasoning.
   ```

##### Technical Specifications

**Architecture:**
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Journal Entry  │────▶│  AI Service  │────▶│  Ontology   │
│   (Trigger)     │     │  (Extract)   │     │   Storage   │
└─────────────────┘     └──────────────┘     └─────────────┘
                              │                      │
                              ▼                      ▼
                        ┌──────────────┐     ┌─────────────┐
                        │  Suggestion  │     │  Dashboard  │
                        │    Queue     │     │    View     │
                        └──────────────┘     └─────────────┘
```

**Component Structure:**
- `/src/components/ontology/OntologySection.tsx` - Main container
- `/src/components/ontology/SuggestionCard.tsx` - Individual suggestion UI
- `/src/components/ontology/OntologyDashboard.tsx` - Approved items view
- `/src/components/ontology/ExtractionStatus.tsx` - Processing feedback
- `/src/app/api/extract-ontology/route.ts` - Next.js API route for GPT-5 Responses API calls
- `/src/services/ontologyExtractor.ts` - Frontend service to call API route
- `/src/lib/ontologyStorage.ts` - LocalStorage management
- `/src/utils/ontologyHelpers.ts` - Deduplication, validation utilities

**State Management:**
```typescript
interface OntologyState {
  suggestions: OntologySuggestion[]
  approvedItems: ApprovedOntologyItem[]
  processingStatus: 'idle' | 'extracting' | 'error'
  dailyApiCallsUsed: number
  lastExtractionDate: string
}
```

##### Edge Cases & Error Handling

1. **API Failures:**
   - Show user-friendly error: "Ontology extraction temporarily unavailable"
   - Queue entries for retry when service restored
   - Log errors for debugging

2. **Insufficient Content:**
   - Entries under 100 words show message: "Entry too short for meaningful extraction"
   - Combine multiple short entries if user approves

3. **Conflicting Extractions:**
   - If AI extracts contradicting beliefs, present both with context
   - Allow user to choose which represents current thinking

4. **Storage Limits:**
   - Warn when approaching localStorage limit (5MB)
   - Implement cleanup of old rejected suggestions

5. **Rate Limiting:**
   - Clear indication of daily limit (e.g., "7 of 10 extractions used today")
   - Reset counter at midnight user's local time

##### Success Metrics

1. **Engagement:**
   - 80% of users review at least one AI suggestion within first week
   - 60% approval rate for high-confidence suggestions

2. **Quality:**
   - Less than 10% of approved items later edited/removed
   - High confidence suggestions have 75%+ approval rate

3. **Performance:**
   - Extraction completes within 5 seconds per entry
   - UI remains responsive during extraction
   - Token usage optimized with GPT-5's reasoning efficiency
   - Cost tracking: Improved cost efficiency with GPT-5's optimized reasoning
   - Chain-of-thought passing reduces redundant reasoning in multi-turn conversations

##### Future Enhancements (Not in MVP)

1. **Advanced GPT-5 Features:** Leverage custom tools and allowed tools for enhanced extraction
2. **Batch Processing:** Process all historical entries on first activation
3. **Ontology Evolution:** Track how values/beliefs change over time
4. **Social Sharing:** Compare ontologies with friends (privacy-controlled)
5. **Smart Prompts:** Generate journal prompts based on ontology gaps
6. **Supabase Migration:** Move to server-side processing for better performance
7. **Advanced Parameters:** Utilize new GPT-5 features like verbosity control and reasoning effort

##### Testing Requirements

1. **Unit Tests:**
   - Extraction prompt formatting
   - Deduplication logic
   - Storage operations
   - API error handling

2. **Integration Tests:**
   - Full extraction workflow with mock API
   - Approval/rejection flow
   - Dashboard data display

3. **Manual Testing:**
   - Test with all 20 sample entries
   - Verify extraction quality across different writing styles
   - Test rate limiting and error states
   - Verify localStorage persistence

#### Story 2.5: Bidirectional Link Database Schema (DEFERRED)

As a developer,
I want a robust database schema that tracks bidirectional relationships between journal entries and notes,
so that the knowledge graph can support complex interconnections and future features.

##### Acceptance Criteria
1. Links table with proper foreign key relationships to journals and notes
2. Link type field supports different relationship types (created_from, references, related_to)
3. Bidirectional relationship tracking with automatic reverse link creation
4. Database constraints prevent orphaned links when content is deleted
5. Link creation timestamps and metadata are properly stored
6. Database indexes optimize link traversal and graph queries
7. Schema supports future expansion for additional link types and metadata

#### Story 2.6: Note Management & Organization Interface (DEFERRED)

As a user,
I want to view and organize all my created notes,
so that I can find and manage my linked knowledge efficiently.

##### Acceptance Criteria
1. Dedicated Notes section in the collapsible sidebar navigation
2. Notes list displays titles, creation dates, and link counts
3. Search functionality allows finding notes by title or content
4. Notes can be opened for editing from the management interface
5. Visual indicators show which notes are linked to journal entries
6. Notes list supports sorting by creation date, title, or relevance
7. Empty or orphaned notes are clearly identified for cleanup

#### Story 2.7: Link Navigation & Visual Connections (DEFERRED)

As a user,
I want to see visual indicators of connected content and navigate between linked items,
so that I can explore the relationships between my thoughts and ideas.

##### Acceptance Criteria
1. Journal entries display visual indicators (badges/counters) showing number of linked notes
2. Notes display backlinks showing which journal entries reference them
3. Clicking links provides smooth navigation between connected content
4. Link traversal maintains proper browser history for back/forward navigation
5. Visual connection indicators help users understand relationship patterns
6. Hover states provide preview information about linked content
7. Link navigation works consistently across all interface contexts

### Epic 3: Feedback-First Social Layer & Basic Karma

**Epic Goal:** Create the collapsible sidebar navigation with the Feedback feature as the primary social interface - a Twitter-like feed specifically optimized for gathering app feedback and building community engagement. Implement the basic Karma point system that rewards users for valuable feedback contributions, establishing the foundation for the broader social features to come.

#### Story 3.1: Collapsible Sidebar Navigation Structure

As a user,
I want a clean collapsible sidebar navigation with clearly organized sections,
so that I can easily access different features while maintaining focus on journaling.

##### Acceptance Criteria
1. Collapsible sidebar with hamburger menu icon that slides in/out from the left
2. Navigation sections: Journal, Notes, Feedback, Articles, Meets, Karma
3. Active section highlighted with visual indicator following shadcn Notebook theme
4. Sidebar state persists across sessions using localStorage
5. Responsive behavior: Auto-collapse on mobile, persistent on desktop
6. Smooth animations for expand/collapse transitions
7. Keyboard shortcuts for quick navigation between sections

#### Story 3.2: Feedback Feed Interface

As a user,
I want to view and post feedback about the app in a dedicated social feed,
so that I can contribute to the product development and connect with other early users.

##### Acceptance Criteria
1. Clean feed interface displaying feedback posts in reverse chronological order
2. Post composition area with rich text editor (Lexical) at top of feed
3. Feedback tag selector: General, Feature Request, Bug Report
4. Character limit indicator (500 characters for MVP)
5. Real-time feed updates using Supabase Realtime subscriptions
6. Loading states and error handling for feed operations
7. Empty state with helpful prompts for first-time users

#### Story 3.3: Publishing Journal Entries as Feedback

As a user,
I want to publish selected journal entries as feedback posts with one click,
so that I can share insights from my journaling that might help improve the app.

##### Acceptance Criteria
1. "Share as Feedback" button on journal entries when hovering/selecting
2. Pre-fill feedback composer with journal entry content (truncated if needed)
3. Automatic tag suggestion based on content analysis
4. Confirmation dialog before publishing to prevent accidental shares
5. Visual indicator on journal entries that have been shared
6. Link back to original journal entry maintained in database
7. Privacy: Only the shared excerpt is public, not the full journal entry

#### Story 3.4: Basic Karma Points System

As a user,
I want to award Karma points to valuable feedback posts,
so that I can recognize and encourage helpful contributions from the community.

##### Acceptance Criteria
1. Karma button (star/heart icon) on each feedback post
2. Click to award 1 Karma point to the post author
3. Visual feedback when Karma is awarded (animation/color change)
4. Running total of Karma received displayed on user profiles
5. Daily Karma allowance: Users can award 5 Karma points per day
6. Cannot award Karma to own posts
7. Karma transactions logged in database with timestamp and giver/receiver

#### Story 3.5: User Profiles with Karma Display

As a user,
I want to view user profiles showing Karma totals and contribution history,
so that I can identify valuable community members and build reputation.

##### Acceptance Criteria
1. Simple user profile accessible by clicking username in posts
2. Profile displays: Username, Join date, Total Karma received, Recent feedback posts
3. Karma badge/level based on total points (e.g., Contributor, Advocate, Champion)
4. User's own profile shows Karma given vs received
5. Profile URL structure: /user/[username]
6. Privacy: No journal content visible, only public feedback posts
7. Responsive layout following shadcn Notebook theme

#### Story 3.6: Karma Subscription Foundation

As a user,
I want to understand how to acquire more Karma points to give,
so that I can support the community and access premium features.

##### Acceptance Criteria
1. Karma balance indicator in sidebar showing points available to give
2. "Get More Karma" call-to-action when balance is low
3. Subscription page explaining Karma system and benefits
4. Placeholder for Stripe integration (not functional in MVP)
5. Clear messaging: "Support development and reward great feedback"
6. FAQ section explaining Karma philosophy and future plans
7. Subscription tiers displayed but marked as "Coming Soon"

### Epic 4: AI-Powered Personal Ontology & Enhanced Feedback

**Epic Goal:** Build the background AI processing system that analyzes journal entries to extract personal Values, Beliefs, and Aims, presenting these as gentle suggestions for user approval. Simultaneously enhance the Feedback system to support broader community discussions beyond just app feedback, establishing Signum as a platform for meaningful discourse.

#### Story 4.1: AI Analysis Pipeline Architecture

As a developer,
I want a robust asynchronous pipeline for AI processing of journal entries,
so that ontology extraction happens seamlessly without blocking user interactions.

##### Acceptance Criteria
1. Background job queue using Supabase Edge Functions or Vercel serverless
2. Webhook triggered on journal entry creation/update
3. Rate limiting to manage OpenAI API costs (max X entries per user per day)
4. Graceful degradation when API limits reached with user notification
5. Processing status tracked in database (pending, processing, completed, failed)
6. Retry logic with exponential backoff for failed analyses
7. Monitoring and logging for debugging and cost tracking

#### Story 4.2: Values, Beliefs, and Aims Extraction

As a user,
I want the AI to identify potential Values, Beliefs, and Aims from my journal entries,
so that I can build a personal ontology that reflects my authentic self.

##### Acceptance Criteria
1. AI prompt engineering optimized for philosophical concept extraction
2. Extracted concepts categorized as Values, Beliefs, or Aims
3. Confidence scoring for each extraction (high/medium/low)
4. Duplicate detection to avoid suggesting existing ontology items
5. Context preservation: Link suggestions back to source journal entries
6. Minimum entry length requirement (100 words) for meaningful analysis
7. Multi-entry pattern recognition for stronger suggestions

#### Story 4.3: Ontology Review & Approval Interface

As a user,
I want to review and approve AI-suggested additions to my personal ontology,
so that I maintain control over how my identity is represented.

##### Acceptance Criteria
1. Dedicated "Ontology" section in sidebar navigation
2. Pending suggestions displayed as cards with source context
3. Approve/Reject/Edit actions for each suggestion
4. Ability to modify suggested text before approval
5. Batch operations for reviewing multiple suggestions
6. Suggestion history log showing accepted/rejected items
7. Visual indicators for new suggestions requiring review

#### Story 4.4: Personal Ontology Dashboard

As a user,
I want to view and manage my complete personal ontology,
so that I can see my growth and ensure it accurately reflects my values.

##### Acceptance Criteria
1. Organized display of Values, Beliefs, and Aims in separate sections
2. Edit/Delete capabilities for existing ontology items
3. Manual addition of items without AI suggestion
4. Chronological view showing ontology evolution over time
5. Export functionality for personal backup (JSON format)
6. Privacy controls for future social sharing features
7. Search and filter capabilities within ontology

#### Story 4.5: Enhanced Feedback Categories & Discovery

As a user,
I want to participate in broader discussions beyond app feedback,
so that the platform becomes a space for meaningful community dialogue.

##### Acceptance Criteria
1. Expanded feedback categories: Philosophy, Self-Improvement, Life Decisions, Community
2. Category filters in feedback feed for focused browsing
3. Trending topics based on recent activity and Karma awards
4. Search functionality within feedback posts
5. Bookmark/Save feature for valuable feedback posts
6. Category-specific prompts to encourage participation
7. Community guidelines for each category

#### Story 4.6: Values-Based Connection Suggestions

As a user,
I want to discover other users who share similar values and beliefs,
so that I can build meaningful connections within the community.

##### Acceptance Criteria
1. Optional ontology sharing settings (private/friends/public)
2. "Similar Minds" section showing users with overlapping values
3. Compatibility percentage based on ontology overlap
4. Introduction prompts based on shared values
5. Privacy-first approach: Only show connections if both users opt-in
6. Connection requests with personalized messages
7. Foundation for future "Meets" feature (in-person connections)

### Epic 5: Articles Foundation & Cross-Feature Integration

**Epic Goal:** Implement the basic Articles functionality that allows users to transform their notes and journal insights into publishable long-form content. Establish the foundational architecture for cross-feature integration where journal entries flow into feedback posts, notes become articles, and the Karma system rewards meaningful contributions across all platform features.

#### Story 5.1: Article Composition from Notes

As a user,
I want to convert my notes into structured articles,
so that I can share deeper insights and knowledge with the community.

##### Acceptance Criteria
1. "Convert to Article" action available on notes
2. Article editor with title, subtitle, and body sections
3. Rich text formatting with Lexical editor
4. Ability to link multiple notes into a single article
5. Draft saving with auto-save functionality
6. Preview mode showing how article will appear when published
7. Article metadata: Reading time estimate, word count, creation date

#### Story 5.2: Article Publishing & Distribution

As a user,
I want to publish my articles to share knowledge with the community,
so that I can contribute to collective learning and earn recognition.

##### Acceptance Criteria
1. Publish button with confirmation dialog
2. Published articles appear in dedicated Articles section
3. Article permalink structure: /articles/[article-slug]
4. Social sharing metadata (Open Graph tags) for external sharing
5. Author byline with link to user profile and Karma total
6. View count and read time tracking
7. RSS feed generation for article subscriptions

#### Story 5.3: Article Discovery & Reading Experience

As a user,
I want to discover and read articles from other users,
so that I can learn from the community's collective insights.

##### Acceptance Criteria
1. Articles feed with sorting options (newest, popular, recommended)
2. Clean reading interface following shadcn Notebook theme
3. Table of contents for longer articles (auto-generated from headings)
4. Reading progress indicator
5. Full-text search within articles
6. Category tags for article organization
7. Related articles suggestions based on content similarity

#### Story 5.4: Cross-Feature Karma Integration

As a user,
I want the Karma system to work across all features,
so that valuable contributions are recognized regardless of format.

##### Acceptance Criteria
1. Karma awards available on articles (higher weight than feedback posts)
2. Different Karma values: Feedback (1 point), Articles (3 points), Future features (TBD)
3. Unified Karma balance across all features
4. Activity feed showing Karma transactions across features
5. Karma analytics: See which content types earn most recognition
6. Leaderboards separated by content type and overall
7. Karma multipliers for special events or featured content

#### Story 5.5: Journal-to-Feedback-to-Article Pipeline

As a user,
I want my ideas to flow naturally from private journal to public article,
so that insights can evolve and mature through community interaction.

##### Acceptance Criteria
1. Visual indicators showing content relationships (journal → feedback → article)
2. "Develop Further" prompts on popular feedback posts
3. Article attribution showing origin (if derived from feedback/journal)
4. Privacy controls at each stage of the pipeline
5. Version history showing content evolution
6. Analytics showing which journal entries led to valuable public content
7. Suggestions for which journal entries might make good articles

#### Story 5.6: Unified Search & Discovery

As a user,
I want to search across all my content and the community's public content,
so that I can find relevant information regardless of where it exists.

##### Acceptance Criteria
1. Global search bar accessible from all screens
2. Search scope selector: My Content, Community, Everything
3. Content type filters: Journals, Notes, Feedback, Articles
4. Advanced search with date ranges and author filters
5. Search results grouped by content type with relevance scoring
6. Recent searches and saved searches functionality
7. Search analytics to improve AI suggestions and content discovery

---

## Checklist Results

*To be completed after Epic development*

## Next Steps

*To be generated after Epic completion*