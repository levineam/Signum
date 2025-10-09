# Signum Product Requirements Document (PRD)

**Date:** September 28, 2025
**Status:** Development Phase - Deployed & Functional
**Version:** 3.0 (Consolidated Greenfield Implementation)

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

## Current Status

**Deployment Status:** ✅ **LIVE IN PRODUCTION**
- **Production URL:** https://ontology-mu.vercel.app
- **Dev URL:** https://signum-im11dbdvv-levineams-projects.vercel.app
- **GitHub Repository:** https://github.com/levineam/Signum
- **Deployment Pipeline:** Automated via GitHub → Vercel integration

**Technical Architecture:**
- **Framework:** Next.js 15.5.3 with Turbopack
- **Authentication:** Supabase Auth with email/password (UI complete, data layer integration in progress - Story 2.4.1)
- **Database:** Supabase PostgreSQL
- **Hosting:** Vercel with automatic deployments
- **Repository:** Consolidated single-repo structure

**Implemented Features:**
- ✅ WYSIWYG rich text editor with toolbar
- ✅ Journal entry creation and editing
- ✅ Text selection and note creation from highlights
- ✅ Bidirectional linking between entries and notes
- ✅ Notes Page with Personal Ontology UI (Values, Beliefs, Aims)
- ✅ 20 sample notes for ontology extraction testing
- ✅ Sample journal data for testing
- ✅ Authentication system
- ✅ Cloud data persistence (partial - needs unification)
- ✅ Responsive UI with shadcn/ui components

**Next Priorities:**
1. ✅ **Story 2.4.0**: Dev Environment Setup (complete)
2. ✅ **Story 2.4.1**: Complete Auth Integration (complete)
3. ✅ **Story 2.4.2**: Migrate Links to Supabase (MVP) (complete)
4. ✅ **Story 2.4.3**: AI Personal Ontology Extraction with GPT-5-mini (complete)
5. **Story 2.4.4**: Incremental AI Ontology Analysis (incremental analysis on new journal entries)

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-09 | 3.8 | **Story 2.4.3 completed** (PR #11 merged). AI Personal Ontology Extraction with GPT-5-mini now functional. "Analyze My Notes" button processes up to 20 notes and populates Values, Beliefs, and Aims cards. Fixed critical bug where GPT-5-mini returns empty `output_text` in reasoning mode by extracting from `response.output` message chunks. Fixed P1 bug where only first chunk was read, causing truncated responses - now concatenates all chunks with `join('')`. Uses OpenAI Responses API with `reasoning.effort: 'medium'`. See `docs/story-2.4.3-ontology-extraction.md` for MVP scope. | Claude Code |
| 2025-10-09 | 3.7 | **Story 2.4.2 (MVP) completed** (PR #8 Phase 1, PR #9 Phase 2 merged). Links now persist to Supabase with metadata and rehydrate on page load using exact text matching. Phase 0: Added `metadata` JSONB column to `links` table. Phase 1: Link creation captures selection metadata (snippet, contextBefore, contextAfter), adds `data-link-id` attributes. Phase 2: Link rehydration on journal entry load fetches from Supabase and restores missing links. Deferred advanced features (dangling link detection, fuzzy matching, recovery UI) to Story 2.4.6+. Total effort: 6 days. | Claude Code |
| 2025-10-08 | 3.6 | Story 2.4.1 completed (PR #7 merged). Discovered link persistence issue (localStorage) during manual testing and data recovery. Created Story 2.4.2 for link migration to Supabase (MVP scope, 4-6 days). Renumbered existing stories: Ontology Extraction 2.4.2→2.4.3, Incremental Analysis 2.4.3→2.4.4, Analytics 2.4.4→2.4.5. See `docs/story-2.4.2-linked-text-resilience-plan.md` and `docs/story-2.4.2-linked-text-resilience-REVIEW.md` | Claude Code |
| 2025-10-06 | 3.5 | **COURSE CORRECTION:** PR #3 review revealed P0 security issue (shared PROTOTYPE_USER_ID exposing all user data publicly). Root cause: deployment model mismatch - code assumed "prototype phase" that doesn't exist. Split Story 2.4 into 3 sequential stories: 2.4.0 (Dev Environment Setup), 2.4.1 (Complete Auth Integration), 2.4.2 (Ontology Extraction). Created persistent dev environment. Completed auth integration from partial Story 1.3. See `docs/sprint-change-proposal-2025-10-06.md` | John (PM) |
| 2025-10-05 | 3.4 | **SCOPE EXPANSION:** Story 2.4 expanded to include Supabase migration. Testing revealed localStorage + sample array architecture caused "Note not found" errors. All notes storage migrated to Supabase within Story 2.4. 7-commit implementation strategy with temporary unauthenticated access for prototype phase. | Claude Code |
| 2025-10-01 | 3.3 | Story 2.3.6 completed (simplified) - Supabase foundation built without premature migration complexity. Database schema, types, and CRUD operations ready. App continues using localStorage for prototype phase. See `/docs/story-2.3.6.md` | Claude Code |
| 2025-09-30 | 3.2 | **MAJOR REFACTOR:** Added Story 2.3.6 (Unified Note Data Model & Supabase Migration) as critical prerequisite for AI features. Updated Story 2.4 with GPT-5-mini integration, Supabase storage, and MVP scope. Created comprehensive documentation: `/docs/openai-gpt5-api.md`, `/docs/data-model-unification.md`, `/docs/story-2.4.2-ontology-extraction.md` | John (PM) |
| 2025-09-30 | 3.1 | Story 2.3.5 completed - Notes Page UI Foundation with Personal Ontology cards. Added 20 sample notes designed for ontology extraction testing (see `/scripts/seed-ontology-notes.js`) | Claude Code |
| 2025-09-28 | 3.0 | **MAJOR MILESTONE:** Consolidated repository structure, deployed to production, established CI/CD pipeline. All foundational features implemented and functional. | Claude Code |
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

##### Status: PARTIALLY COMPLETE

**Completed in Epic 1:**
- ✅ Supabase Auth integration with email/password signup and login
- ✅ User session management across page refreshes
- ✅ Password reset functionality
- ✅ Authentication UI (forms, context, providers)
- ✅ AuthProvider in root layout
- ✅ Sidebar shows user email and sign out

**Remaining Work (completed in Story 2.4.1, Epic 4):**
- ⏸️ Route protection for unauthenticated users
- ⏸️ Notes CRUD integration with authenticated user
- ⏸️ RLS policies enforcing authentication
- ⏸️ PROTOTYPE_USER_ID removal

**Completion:** Story 2.4.1 will complete this work

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

#### Story 2.3.5: Notes Page UI Foundation ✅ COMPLETED

As a user,
I want a dedicated Notes page where I can view and edit my personal ontology (Values, Beliefs, Aims) and other reflective notes,
so that I have a centralized place to refine my thinking before implementing AI-powered extraction.

##### Acceptance Criteria

**UI Layout:**
1. ✅ Notes page accessible via sidebar "Notes" button
2. ✅ Pinned row at top displaying 3 special notes:
   - Values (single consolidated note)
   - Beliefs (single consolidated note)
   - Aims (single note with two sections: Todos and Goals)
3. ✅ Each pinned card shows title and character count
4. ✅ Below pinned row: chronological list of regular notes (reverse chronological order)
5. ✅ Empty state message: "No notes yet. Create notes from your journal entries."

**Note Editing:**
1. ✅ Click any note card to open full-page editor
2. ✅ Plain text editing (no rich text formatting for MVP)
3. ✅ Aims note shows two fixed sections with separate textareas:
   - "Todos" heading (fixed, not user-editable)
   - "Goals" heading (fixed, not user-editable)
4. ✅ Auto-save on blur or manual Save button
5. ✅ Back button returns to main app
6. 🔄 **CORRECTION NEEDED**: Values, Beliefs, and Aims notes should be READ-ONLY (AI-populated only)
   - Manual editing increases cognitive load
   - Contradicts core principle: minimize friction, maximize note creation
   - These notes should ONLY be populated autonomously through AI analysis

**Data Management:**
1. ✅ Pinned notes auto-created empty on first visit
2. ✅ All data stored in localStorage
3. ✅ Note type system: `'values' | 'beliefs' | 'aims' | 'regular'`
4. ✅ Character count calculation combines both sections for Aims note

**Technical Implementation:**
- ✅ `/src/types/note.ts` - Updated with `type` and `isPinned` fields
- ✅ `/src/lib/notes.ts` - Helper functions for pinned notes
- ✅ `/src/components/notes/PinnedNoteCard.tsx` - Pinned note display
- ✅ `/src/components/notes/RegularNoteCard.tsx` - Regular note preview
- ✅ `/src/components/notes/NotesPage.tsx` - Main page layout
- ✅ `/src/app/notes/page.tsx` - Route wrapper
- ✅ `/src/app/notes/[id]/page.tsx` - Dynamic note editor with Next.js 15 async params support

##### Success Metrics
1. ✅ Users can create and edit all three ontology notes
2. ✅ Character counts update correctly after saving
3. ✅ Aims note properly separates Todos and Goals
4. ✅ Navigation between Notes page and editor works smoothly

##### Notes
- This story was completed as a UI-first approach to validate the Notes page UX before implementing AI extraction
- Regular notes are view-only for now - creation will come from journal entries in later stories
- No creation button by design - forces intentional note creation from journaling context
- **CRITICAL DESIGN PRINCIPLE**: Values/Beliefs/Aims notes must be AI-populated only to minimize cognitive load and encourage natural journaling. Manual editing capability was incorrectly implemented and needs correction.

##### Sample Notes for Ontology Testing
To prepare for AI Ontology Extraction (Stories 2.3.6 & 2.4), 20 sample notes were created with rich semantic content:
- **Script Location**: `/scripts/seed-ontology-notes.js` (browser console script)
- **Usage**: See `/scripts/README.md` for instructions
- **Content Design**: Notes contain diverse themes, values, relationships, and life events specifically designed to test ontology extraction:
  - **Values**: Compassion, meaning, justice, presence, personal agency, integrity
  - **Key People**: Sarah Johnson, Marcus Chen, Dr. Priya Patel, Emma (daughter)
  - **Organizations**: GreenFuture nonprofit, Impact Investors Network
  - **Themes**: Work-life balance, community building, entrepreneurship, AI ethics, parenting, personal growth
  - **Life Events**: Career changes, health diagnoses, business failures, learning journeys
  - **Philosophical Concepts**: Justice vs. charity, identity beyond work, meaning vs. happiness
- **Testing Goal**: Validate that GPT-5 can successfully extract values, beliefs, relationships, and recurring themes from realistic personal notes

---

#### Story 2.3.6: Unified Note Data Model & Supabase Foundation ✅ COMPLETE (Simplified for Prototype)

As a developer,
I want a unified Note data model and Supabase foundation ready to use,
so that when we're ready to switch from localStorage, we have a clean migration path without premature complexity.

##### What We Built

**Supabase Foundation (Ready When Needed):**
- ✅ Database schema with unified `notes` table
- ✅ Unified TypeScript types (`Note` interface with `noteType` discriminator)
- ✅ Complete CRUD operations in `src/lib/supabase/notes.ts`
- ✅ Row-Level Security (RLS) policies
- ✅ Indexes for performance

**Current State:**
- App continues using localStorage (no breaking changes)
- Supabase foundation ready but not actively used
- Clean migration path when we need it

**Why Simplified:**
- Zero users = no migration needed yet
- Prototype phase = fast iteration more important than premature optimization
- Can switch to Supabase with 2 component updates when ready
- Migration code preserved in git history if ever needed

##### What's Ready

**✅ Database Schema** (`supabase/migrations/20250930000000_unified_notes_schema.sql`)
- Unified `notes` table with `note_type` discriminator
- Support for: `journal-entry | reflection | ontology-value | ontology-belief | ontology-aim | custom`
- JSONB metadata field for type-specific data
- RLS policies and indexes

**✅ TypeScript Types** (`src/types/note.ts`)
- Unified `Note` interface
- `NoteType` enum
- Request/response types for CRUD

**✅ CRUD Operations** (`src/lib/supabase/notes.ts`)
- `getJournalEntries()`, `getRegularNotes()`, `getOntologyNotes()`
- `createNote()`, `updateNote()`, `deleteNote()`
- `createLink()`, `deleteLink()` for relationships
- `initializeOntologyNotes()` for new users

**⏳ Not Yet Integrated** (Intentional - localStorage still works)
- JournalStream still reads from localStorage
- NotesPage still reads from localStorage
- No migration script (not needed for zero users)

##### How to Switch to Supabase (When Ready)

**Simple 2-Step Process:**
1. Update `JournalStream` component to call `getJournalEntries(userId)` instead of localStorage
2. Update `NotesPage` component to call `getRegularNotes(userId)` and `getOntologyNotes(userId)`

**Data Handling Options:**
- **Option A**: Tell early users data will reset (acceptable for prototype)
- **Option B**: Build simple migration script if needed (code exists in git history)

##### Documentation

See **`/docs/story-2.3.6.md`** for complete details on what was built and how to use it.

##### Status

**Complete**: Supabase foundation ready ✅
**Integration Status**: ✅ **COMPLETED in Story 2.4** - Components migrated to use Supabase (was originally deferred for prototype phase, but testing revealed localStorage approach caused production mismatches)

---

#### Story 2.4: AI Personal Ontology Extraction with Supabase Migration 🚧 IN PROGRESS

**Prerequisites:** Story 2.3.6 (Unified Note Data Model) ✅ Complete

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from **all my notes**,
so that I can build a structured personal ontology that helps me understand my authentic self and track my philosophical evolution over time.

##### Context & Documentation

- **Complete Implementation Guide**: `/docs/story-2.4.2-ontology-extraction.md`
- **GPT-5-mini API Documentation**: `/docs/openai-gpt5-api.md`
- **Data Model Reference**: `/docs/data-model-unification.md`
- **Supabase Project**: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
- **Sample Test Data**: 20 notes in system (see `/scripts/seed-ontology-notes.js`)

##### MVP Scope (Story 2.4.1)

This story implements the **simplest possible working extraction** to validate value to users, **including migration from localStorage to Supabase**.

**What's Included:**
- **Supabase Migration**: All notes storage migrated from localStorage to Supabase
  - Sample journal entries seeded into database
  - CRUD operations use Supabase client
  - Temporary unauthenticated access for prototype phase
- Manual "Analyze My Notes" button on Notes page
- Processes up to 20 most recent notes (excluding ontology notes)
- Direct population of Values/Beliefs/Aims cards (no approval workflow)
- GPT-5-mini for cost efficiency
- Server-side note fetching in API route for security

**What's Deferred to Post-MVP:**
- Suggestion review/approval UI (Story 2.4.3)
- Incremental processing (Story 2.4.4)
- Analytics dashboard (Story 2.4.5)

##### Acceptance Criteria

**Core Functionality:**
1. ✅ System analyzes notes using OpenAI GPT-5-mini (cost-efficient model)
2. ✅ Manual trigger via "Analyze My Notes" button on Notes page
3. ✅ Processes notes where `noteType IN ('journal-entry', 'reflection', 'custom')` (up to 20 most recent)
4. ✅ Each extraction includes:
   - Concept text (short, memorable phrase)
   - Category (value/belief/aim)
   - Confidence score (high/medium/low)
   - Source note IDs
   - AI reasoning
5. ✅ High-confidence extractions automatically stored as ontology notes:
   - `noteType: 'ontology-value'` → populates Values card
   - `noteType: 'ontology-belief'` → populates Beliefs card
   - `noteType: 'ontology-aim'` → populates Aims card

**UI Integration:**
1. ✅ "Analyze My Notes" button on Notes page
2. ✅ Loading spinner during extraction
3. ✅ Success toast: "Found X values, Y beliefs, Z aims"
4. ✅ Error toast for API failures
5. ✅ Cards auto-refresh after extraction

**Data Storage (Supabase):**
1. ✅ Ontology items stored in unified `notes` table
2. ✅ Deduplication by title (case-insensitive)
3. ✅ Metadata includes: `confidence`, `extractedFrom`, `aiReasoning`

**API Integration:**
1. ✅ Next.js API route: `/src/app/api/extract-ontology/route.ts`
2. ✅ Model: `gpt-5-mini` (cost-efficient)
3. ✅ Responses API with `reasoning.effort: 'medium'`
4. ✅ API key: `OPENAI_API_KEY` environment variable (server-side only)
5. ✅ Error handling for API failures

**Supabase Migration:**
1. ✅ All note CRUD operations use Supabase instead of localStorage
2. ✅ Sample journal entries seeded into Supabase database
3. ✅ NotesPage component fetches from Supabase
4. ✅ Note detail page fetches from Supabase (no sample array fallback)
5. ✅ JournalStream saves to Supabase with auto-save
6. ✅ Unauthenticated access enabled for prototype phase
7. ✅ No localStorage references remain in production code

##### Technical Implementation

**See `/docs/story-2.4.2-ontology-extraction.md` for complete details including:**
- Full architecture diagram
- Component structure
- API route implementation
- Prompt engineering templates
- TypeScript interfaces
- Testing strategy
- Implementation checklist

**Key Files:**
- `/src/app/api/extract-ontology/route.ts` - API route (NEW)
- `/src/components/notes/OntologyAnalysisButton.tsx` - UI component (NEW)
- `/src/lib/ontology/deduplication.ts` - Deduplication logic (NEW)
- `/src/utils/ontologyPrompts.ts` - Prompt templates (NEW)

##### Success Metrics

1. **Extraction Success Rate**: > 95% of extractions complete without errors
2. **Quality**: Manual review shows > 80% relevance of extracted items
3. **Performance**: Extraction completes within 10 seconds
4. **Cost**: < $0.10 per 20-note extraction with GPT-5-mini

##### Testing with Sample Data

**Expected Results with 20 Sample Notes:**
- Values card: 5-8 values (e.g., "Compassion", "Integrity", "Presence")
- Beliefs card: 5-10 beliefs (e.g., "Meaning over happiness", "People have inherent wisdom")
- Aims card: 3-5 aims (e.g., "Balance ambition with presence", "Build community connections")

##### Implementation Notes

**Why Supabase Migration Happened in Story 2.4:**

During Story 2.4 testing, the hybrid localStorage + sample array approach revealed critical issues:
- **Issue**: Ontology extraction created note references to sample journal entries that only existed in memory, causing "Note not found" errors when clicking links
- **Root Cause**: Testing environment (localStorage + sample arrays) didn't match production behavior (Supabase)
- **Decision**: Migrate to Supabase within Story 2.4 instead of deferring to later story
- **Benefit**: Ensures testing matches production, eliminates complex hybrid logic, validates full end-to-end flow

**Auth Strategy for Prototype:**
- Unauthenticated access enabled with fixed user ID: `00000000-0000-0000-0000-000000000000`
- RLS policies configured to allow public access temporarily
- Migration path: Swap fixed ID with real auth when ready for production

**Commit Structure:**
1. Update notes.ts with Supabase CRUD
2. Create and run seed script for sample data
3. Update NotesPage to fetch from Supabase
4. Update note detail page and remove fallback logic
5. Update JournalStream to save to Supabase
6. Improve extract-ontology to fetch notes server-side
7. Remove sample data array and localStorage references

##### Future Enhancements (Post-MVP)

- **Story 2.4.4**: Incremental analysis (automatic analysis on new journal entries) - NEXT
- **Story 2.4.5**: Suggestion review/approval workflow for AI-extracted ontology items
- **Story 2.4.6+**: Advanced link features (dangling link detection, fuzzy matching, recovery UI)
- **Story 2.4.7**: Analytics dashboard and ontology evolution tracking

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

#### Story 2.4.0: Dev Environment Setup ✅ NEXT

As a developer,
I want a persistent development environment with production-like configuration,
so that I can test features with real authentication before deploying to production.

##### Acceptance Criteria
1. `dev` branch created and protected in GitHub
2. Separate Vercel project configured for `dev` branch
3. Dev environment accessible at persistent URL (dev.ontology-mu.vercel.app)
4. CLAUDE.md documents deployment model (dev vs prod vs PR previews)
5. Workflow clear: feature → PR to dev → test → PR to main
6. Environment variables documented
7. Same Supabase project used for both environments

##### Implementation Details
See `docs/story-2.4.0-dev-environment.md`

---

#### Story 2.4.1: Complete Auth Integration ✅ NEXT

As a user,
I want my journal entries and notes to be private and secure,
so that only I can access my personal reflections.

##### Acceptance Criteria
1. Main pages require authentication (redirect to /auth if not logged in)
2. Notes CRUD functions use authenticated user ID (not PROTOTYPE_USER_ID)
3. RLS policies enforce `auth.uid() = user_id` for all data access
4. PROTOTYPE_USER_ID removed entirely from codebase
5. Multi-user testing confirms data isolation in dev environment
6. Route protection implemented on all main pages
7. Loading states shown during auth verification

##### Context
**Completes auth integration from Story 1.3 (Epic 1)**

Story 1.3 implemented auth UI (forms, context, providers) but never integrated with the data layer. This story completes the integration.

**What Already Exists:**
- ✅ AuthContext with Supabase Auth
- ✅ Sign in/sign up/password reset forms
- ✅ `/auth` page with routing
- ✅ AuthProvider in root layout
- ✅ Sidebar displays user email and sign out

**What's Missing (This Story):**
- ❌ Route protection on main pages
- ❌ Notes CRUD using authenticated user
- ❌ RLS policies enforcing auth

##### Implementation Details
See `docs/story-2.4.1-auth-integration.md`

---

#### Story 2.4.2: Migrate Links to Supabase (MVP)

As a user,
I want my note links to persist across browsers and devices,
so that my journal connections remain intact regardless of where I access Signum.

##### Prerequisites
- Story 2.4.1 (Auth Integration) ✅ Complete

##### Problem Statement

Links currently use localStorage (src/lib/links.ts), causing:
- Links vanish across different browsers/devices
- Multi-user conflicts (all links stored in same localStorage)
- Data loss risk (no server backup)
- No metadata (just {text, noteId, entryId})

##### MVP Scope (4-6 days)

**What's Included:**
1. Add `metadata` JSONB field to `links` table
2. Delete `src/lib/links.ts` (no backward compatibility needed - no real users yet)
3. Update JournalStream to use Supabase link functions from `src/lib/supabase/notes.ts`
4. Store link metadata: `{ snippet, contextBefore, contextAfter }`
5. Add `data-link-id` attribute to `<a>` tags (alongside existing `data-note-id`)
6. Rehydrate links using exact text match on load

**What's Deferred (Future Story 2.4.6+):**
- Advanced resilience (dangling link detection, recovery UI, fuzzy matching)
- MutationObserver for link deletion tracking
- Undo functionality
- Link recovery panel

##### Acceptance Criteria

**Core Functionality:**
1. Links persist to Supabase `links` table with metadata
2. Links survive page refresh and cross-device access
3. Existing link creation flow works unchanged (user experience identical)
4. Links rehydrate correctly on journal entry load
5. No localStorage dependencies for links

**Data Model:**
1. `links` table has `metadata` JSONB column (default '{}')
2. Link type includes `metadata` field
3. `CreateLinkRequest` accepts metadata payload

**Testing:**
1. Create note from highlighted text → link persists after refresh
2. Sign out and sign in → links still work
3. Open journal on different browser → links present
4. Multi-link entry works correctly
5. Links survive journal content edits (as long as linked text not deleted)
6. Multi-user isolation (User A's links not visible to User B)

##### Implementation Plan

See:
- `docs/story-2.4.2-linked-text-resilience-plan.md` (Phases 0-2 only for MVP)
- `docs/story-2.4.2-linked-text-resilience-REVIEW.md` (detailed analysis and recommendations)

---

#### Story 2.4.3: Personal Ontology Extraction Foundation

As a reflective journaler,
I want the system to automatically identify and extract my core Values, Beliefs, and Aims from **all my notes**,
so that I can build a structured personal ontology that helps me understand my authentic self.

##### Prerequisites
- Story 2.3.5 (Notes Page UI) ✅ Complete
- Story 2.4.0 (Dev Environment Setup) ✅ Complete
- Story 2.4.1 (Auth Integration) ✅ Complete
- Story 2.4.2 (Link Migration) ✅ Complete

##### Acceptance Criteria
1. "Analyze My Notes" button on Notes page triggers extraction
2. System processes up to 20 most recent notes
3. Extracted concepts categorized as Values, Beliefs, or Aims
4. High-confidence extractions auto-populate ontology cards
5. Success message shows count of extracted items
6. Error handling for API failures
7. Loading spinner during extraction

##### Implementation Details
See `docs/story-2.4.3-ontology-extraction.md`

---

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