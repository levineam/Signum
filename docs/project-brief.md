
### **Project Brief: Signum**

**Executive Summary**
Signum is a journaling-first social platform designed to help its users lead more meaningful lives. It addresses the gap left by current platforms that optimize for advertising and productivity rather than personal insight. Signum provides a calm, frictionless space for journaling and self-discovery. It then uniquely connects those personal insights to a meaningful social experience where users can find like-minded people and build real-world communities, all while being rewarded for their contributions.

**Problem Statement**
Many individuals seek a digital space for meaning-making and self-understanding, yet most social and note-taking platforms are optimized for external metrics (e.g., engagement, productivity, tasks) rather than personal insight. This leaves a significant gap for those who want to connect their daily actions to their core values and beliefs. Existing solutions are either too simple to provide deep insight or too focused on public performance to foster genuine self-reflection. As a result, users lack a dedicated tool that bridges the gap between private journaling and meaningful social connection.

**Proposed Solution**
We will create "Signum," a cloud-native, journaling-centric application that provides a calm, WYSIWYG (What You See Is What You Get) interface. The primary user experience is frictionless capture: a user opens the app to a new journal entry and can begin writing immediately, with their data securely stored in the cloud.

The core innovations are twofold:
1.  **Gentle, Background AI:** An AI engine analyzes journal entries to automatically build a personal ontology of the user's core Values, Beliefs, and Aims, helping to reveal patterns and foster alignment between action and meaning. All AI suggestions are presented as drafts for user approval, ensuring agency and trust.
2.  **Integrated Social Layer:** The app seamlessly integrates this personal reflection with a social platform. Users can easily share thoughts as posts, connect with others based on shared values, and use a built-in "Karma" system to reward each other for insightful contributions.

**Target Users**
* **Primary User Segment: The Reflective Journaler**
    * **Profile:** An introspective individual who values personal growth and self-awareness. They are motivated by a desire to understand themselves better, not by productivity metrics. They have likely tried various journaling methods but found them either too unstructured to provide insight or too rigid to feel personal.
    * **Needs & Pain Points:** They need a frictionless, private space to think and a way to see connections between their thoughts over time. Their current tools often feel disconnected or fail to provide cumulative value.
    * **Goals:** To build a clearer understanding of their personal values, see how their daily actions align with those values, and make more intentional, meaningful decisions.

**Goals & Success Metrics**
* **Business Objectives**
    * Create a stable, delightful, and useful personal journaling and social tool that captures the core vision.
    * Validate that the core AI-driven ontology builder provides tangible value.
    * Ensure the application is robust enough to share with a small group of initial testers.
* **User Success Metrics**
    * The app feels like a calm, frictionless space for daily reflection and connection.
    * The AI suggestions are insightful and help build a valuable personal ontology over time.
    * The tool is reliable enough for daily use without data loss or significant bugs.
* **Key Performance Indicators (KPIs)**
    * **Personal Habit Formation:** The primary user finds the tool valuable enough for journaling at least 5 days a week over a one-month period.
    * **Core Loop Validation:** The AI provides useful suggestions, with the user accepting an average of 5-10 connections into their ontology per week.
    * **Social Engagement:** Users award "Karma" to each other at least 10 times per week, validating the social reward loop.

**MVP Scope**
* **Core Features (Must Have)**
    1.  **Journal Feed & WYSIWYG Editor:** The core interface for frictionless daily journaling.
    2.  **Social Feed & Posts:** A simple social feed where users can see short posts shared by others. A journal entry can be published as a post with a single click.
    3.  **Karma System:** Users can award "Karma" to others' posts, and Karma totals are visible on user profiles. A subscription is the primary way to acquire Karma to give away.
    4.  **In-App Note Linking:** The ability to create a link to another note using `[[wikilink]]` syntax to connect ideas.
    5.  **Initial AI Ontology Builder:** A background process that extracts candidate values, beliefs, and intuitions, suggesting them to the user for confirmation.
    6.  **Cloud-based Data Storage:** All user data (notes, posts, Karma) is stored securely in a cloud database.
* **Out of Scope for MVP**
    * On-chain/crypto integration for the Karma system.
    * "Meets" feature for in-person meetups.
    * "Articles" feature (long-form blogging/newsletters).
    * Mobile apps and any form of offline editing.
    * Advanced graph visualization, semantic search, or multi-user collaboration.

**Post-MVP Vision**
* **Phase 2 Features:** Introduce mobile apps with encrypted sync, semantic search for finding related notes, and a "Meets" feature to facilitate in-person connections.
* **Long-term Vision:** Evolve the "Aims" concept into a lightweight planning system that helps users track goals explicitly linked to their core values. Introduce long-form "Articles" and newsletters.

**Technical Considerations**
* **Platform:** Web Application for the MVP, hosted on Vercel.
* **Backend & Database:** A Cloud-First model. Supabase (PostgreSQL) will serve as the complete backend-as-a-service (BaaS), acting as the single source of truth for all notes, ontology graphs, user data, and the Karma ledger.
* **Security:** User authentication and access control will be managed by Supabase Auth. Data privacy will be enforced using Supabase's Row-Level Security (RLS).

**Constraints & Assumptions**
* **Constraints:** The MVP will be developed by a single individual with AI assistance, prioritizing free/low-cost service tiers. The project must be built using Vercel and Supabase.
* **Key Assumptions:**
    * There is a user segment who will find more value in a tool designed for meaning-making than one for pure productivity or entertainment.
    * AI models can consistently and usefully extract abstract concepts like Values and Beliefs from unstructured text.
    * A seamless, cloud-based WYSIWYG experience is superior for this target user.

**Risks & Open Questions**
* **Key Risks:**
    * **AI Quality & User Trust:** If AI suggestions are poor or intrusive, it could erode user trust.
    * **Privacy Perception:** As a journaling app, user trust in our data handling is paramount.
    * **Cognitive Overload:** The ontology and social features risk introducing complexity that violates the core "calm and frictionless" design principle.
    * **Vendor Lock-in:** Choosing a BaaS like Supabase creates a dependency, making future migrations more complex.
* **Open Questions:**
    * What is the initial conversion rate for Karma points earned per dollar of subscription?
    * What is the strategy for handling the costs of AI model API calls as usage scales?
    * How will the app handle offline situations in a cloud-first model?