# Story 2.5.0: Obsidian Vault Import Tool

**Issue:** #59
**Epic:** 2 (Intelligent Note Linking & Knowledge Graph)
**Priority:** Medium
**Estimate:** 8-10 days

## User Story

As a Signum user with an existing Obsidian vault,
I want to import all my Obsidian notes into Signum with proper formatting and link preservation,
so that I can consolidate my note-taking in one place without losing my existing work or connections between notes.

## Background

Many potential Signum users already have extensive note collections in Obsidian. Providing a seamless import tool removes a major barrier to adoption and allows users to leverage Signum's AI-powered ontology extraction on their existing knowledge base.

Obsidian uses Markdown with several proprietary extensions:
- **WikiLinks**: `[[Note Title]]` for internal links
- **Frontmatter**: YAML metadata at the top of files
- **Tags**: `#tag` syntax
- **Embeds**: `![[Image.png]]` for embedded content
- **Block references**: `[[Note#^block-id]]`

## Prerequisites

- ✅ Story 2.4.1: Auth Integration (complete)
- ✅ Story 2.4.2: Link Migration to Supabase (complete)
- ✅ Unified notes table in Supabase

## Acceptance Criteria

### Phase 1: Basic Import (MVP - Days 1-5)

**Upload Interface:**
1. Settings page has "Import from Obsidian" section
2. Folder upload interface accepts directory selection (multiple .md files)
3. Preview screen shows:
   - Number of files to import
   - Total size
   - List of file names with checkboxes (allow selective import)
4. "Import" button with confirmation dialog
5. Progress indicator during import (X of Y files processed)

**Markdown Conversion:**
1. Standard Markdown formatting preserved (headers, lists, bold, italic, links)
2. WikiLinks `[[Note Title]]` converted to:
   - Placeholder text during import
   - Database link relationships created after all notes imported
   - Internal links rehydrated using `data-note-id` attributes
3. Frontmatter YAML extracted and stored in note metadata JSONB field
4. Standard markdown links `[text](url)` preserved as-is
5. Code blocks preserved with syntax highlighting
6. Block quotes and tables preserved

**Data Storage:**
1. Each .md file creates one note in `notes` table
2. Note type: `noteType: 'custom'` (imported notes)
3. Metadata includes:
   ```json
   {
     "importedFrom": "obsidian",
     "importDate": "ISO timestamp",
     "originalFileName": "Note.md",
     "frontmatter": { /* YAML data */ },
     "tags": ["tag1", "tag2"]
   }
   ```
4. Links between notes stored in `links` table
5. Import creates batch transaction (all-or-nothing for data integrity)

**Link Resolution:**
1. After all notes imported, WikiLinks resolved to actual note IDs
2. Broken links (references to non-existent notes) logged but don't fail import
3. Broken link handling:
   - Store as regular text with special styling (e.g., gray strikethrough)
   - Metadata tracks broken links for user review
4. Link metadata includes: `{ importedWikiLink: true, originalLink: "[[Original]]" }`

**Error Handling:**
1. File size validation (max 10MB per file, 100MB total vault)
2. Duplicate file name handling (append timestamp or show conflict resolution UI)
3. Unsupported file types skipped with warning (only .md files imported)
4. Parse errors logged and displayed in import summary
5. Partial import recovery: If import fails mid-process, user can retry or rollback

**Success Feedback:**
1. Import summary screen shows:
   - ✅ X notes imported successfully
   - ⚠️ Y WikiLinks resolved, Z broken links found
   - ℹ️ List of skipped files with reasons
   - 📎 Attachments deferred to Phase 2
2. "View Imported Notes" button navigates to filtered notes view
3. Option to download import log (JSON file with details)

### Phase 2: Enhanced Features (Future - Days 6-8)

**Attachment Support:**
1. Image files uploaded to Supabase Storage
2. `![[Image.png]]` embeds converted to `<img>` tags with Supabase URLs
3. Other attachments (PDFs, etc.) uploaded and linked
4. File size limits and storage quota management

**Tag Migration:**
1. Obsidian tags extracted from content and frontmatter
2. Tag system created in Signum (new `tags` table)
3. Notes tagged appropriately
4. Tag-based filtering in Notes page

**Advanced Link Features:**
1. Block references `[[Note#^block-id]]` parsed and stored
2. Heading links `[[Note#Heading]]` converted to anchor links
3. Alias support `[[Note|Display Text]]` preserved

**Metadata Preservation:**
1. Created/modified timestamps from frontmatter preserved
2. Custom frontmatter fields stored in metadata JSONB
3. Obsidian graph metadata (if present) preserved for future visualization

### Phase 3: LogSeq Support (Future Enhancement)

**Parser Extension:**
1. Detect LogSeq format (outliner-based vs document-based)
2. Convert block-based structure to hierarchical notes or nested content
3. Preserve page references `[[Page]]`
4. Handle LogSeq queries (stored as metadata for future feature)

## Technical Design

### Database Schema Updates

**No schema changes required** - existing `notes` and `links` tables support import:
- `notes.metadata` JSONB field stores import-specific data
- `notes.noteType` uses `'custom'` for imported notes
- `links.metadata` stores original WikiLink info

### API Routes

**`/api/import/obsidian` (POST)**
```typescript
// Request
{
  files: File[], // .md files from vault
  options: {
    preserveTimestamps: boolean,
    importTags: boolean,
    skipBrokenLinks: boolean
  }
}

// Response
{
  success: boolean,
  summary: {
    notesImported: number,
    linksResolved: number,
    brokenLinks: string[],
    skippedFiles: { fileName: string, reason: string }[],
    errors: string[]
  },
  importId: string // For tracking/rollback
}
```

### Parser Architecture

**Markdown Parser:** Use `remark` ecosystem
- `remark-parse`: Base Markdown parsing
- `remark-frontmatter`: YAML frontmatter extraction
- `remark-wiki-link`: WikiLink parsing
- Custom transformer for Signum HTML format

**Processing Pipeline:**
1. **Parse**: Extract frontmatter, content, links, tags
2. **Transform**: Convert Markdown to Signum HTML format
3. **Store**: Batch insert notes to database
4. **Link**: Resolve WikiLinks to note IDs
5. **Rehydrate**: Update note content with proper `data-note-id` links

### Component Structure

```
/src/components/import/
  ObsidianImportWizard.tsx      # Main import flow
  FileUploadZone.tsx             # Drag-drop file upload
  ImportPreview.tsx              # File list with checkboxes
  ImportProgress.tsx             # Progress indicator
  ImportSummary.tsx              # Results display

/src/lib/import/
  obsidian-parser.ts             # Markdown → Signum conversion
  link-resolver.ts               # WikiLink → note ID mapping
  batch-importer.ts              # Database batch operations

/src/app/settings/import/
  page.tsx                       # Import settings page
```

## User Experience Flow

1. **Navigate**: User clicks Settings → Import → Obsidian
2. **Select**: Chooses folder containing Obsidian vault
3. **Preview**: Reviews list of files, unchecks any to exclude
4. **Configure**: Sets import options (timestamps, tags, etc.)
5. **Confirm**: Clicks "Import X Notes" button
6. **Wait**: Progress bar shows import status
7. **Review**: Summary screen shows results and any issues
8. **Navigate**: Clicks "View Imported Notes" to see results

## Testing Strategy

**Unit Tests:**
- Markdown parser with various Obsidian features
- Link resolver with complex WikiLink patterns
- Metadata extraction from frontmatter

**Integration Tests:**
- Full import flow with sample vault
- Error handling for malformed files
- Rollback on import failure

**E2E Tests (Playwright):**
- Upload sample vault → verify notes created
- Check link preservation → click imported links
- Verify metadata → inspect imported note details

**Test Data:**
Create sample Obsidian vault with:
- 10 interconnected notes
- Various WikiLink formats
- Frontmatter examples
- Tags and code blocks
- Intentionally broken links

## Performance Considerations

- **Batch Processing**: Insert notes in batches of 50 to avoid timeout
- **Link Resolution**: Use single query to map all WikiLinks after import
- **Progress Updates**: WebSocket or polling for real-time progress
- **File Size Limits**: Reject vaults > 100MB (can increase later)
- **Concurrent Imports**: Prevent multiple simultaneous imports per user

## Security Considerations

- **File Validation**: Only accept `.md` files, reject executables
- **Content Sanitization**: Escape HTML in Markdown to prevent XSS
- **User Isolation**: Ensure imports scoped to authenticated user
- **Storage Quotas**: Enforce per-user note limits
- **Rate Limiting**: Prevent abuse via rapid repeated imports

## Success Metrics

1. **Import Success Rate**: > 95% of notes imported without errors
2. **Link Preservation**: > 90% of WikiLinks resolved correctly
3. **User Adoption**: 20%+ of new users use import feature
4. **Performance**: Import 100 notes in < 30 seconds
5. **Data Integrity**: Zero data loss or corruption incidents

## Future Enhancements

- **Incremental Sync**: Re-import vault with conflict resolution
- **Export to Obsidian**: Bidirectional sync capability
- **Notion Import**: Extend parser for Notion exports
- **Roam Research**: Support for Roam JSON exports
- **Bear/Apple Notes**: Native macOS app integrations

## Open Questions

1. **Attachment Storage**: Should we store full files or just links?
   - **Decision**: Phase 1 skips attachments, Phase 2 uploads to Supabase Storage
2. **Duplicate Handling**: Merge or create separate notes?
   - **Decision**: Create separate notes with timestamp suffix, let user merge manually
3. **Folder Structure**: Preserve Obsidian folder hierarchy?
   - **Decision**: Flatten to single notes list for MVP, add folders in future story
4. **Daily Notes**: Special handling for Obsidian daily notes format?
   - **Decision**: Import as regular notes, future feature can convert to journal entries

## Dependencies

**NPM Packages:**
```json
{
  "remark": "^15.0.0",
  "remark-parse": "^11.0.0",
  "remark-frontmatter": "^5.0.0",
  "remark-wiki-link": "^2.0.0",
  "remark-html": "^16.0.0",
  "unified": "^11.0.0"
}
```

## Related Stories

- Story 2.3: Hyperlink Creation (link foundation)
- Story 2.4.2: Link Migration to Supabase (link persistence)
- Story 2.6: Note Management Interface (import results display)
- Future: Story 2.8: Tag System (tag migration support)
- Future: Story 3.X: Folder/Hierarchy Support

## Implementation Checklist

### Phase 1: MVP (Days 1-5)

**Day 1-2: Parser & Converter**
- [ ] Install remark dependencies
- [ ] Create obsidian-parser.ts with WikiLink support
- [ ] Write unit tests for parser
- [ ] Handle frontmatter extraction
- [ ] Convert Markdown to Signum HTML format

**Day 3: Upload UI**
- [ ] Create ObsidianImportWizard component
- [ ] Build file upload interface
- [ ] Add file preview with checkboxes
- [ ] Implement import options form

**Day 4: Backend Integration**
- [ ] Create /api/import/obsidian route
- [ ] Implement batch note insertion
- [ ] Build link resolver
- [ ] Add error handling and rollback

**Day 5: Testing & Polish**
- [ ] Create sample Obsidian vault for testing
- [ ] Write E2E tests
- [ ] Build import summary screen
- [ ] Add import to Settings page

### Phase 2: Enhancements (Days 6-8)
- [ ] Implement attachment upload
- [ ] Add tag system and migration
- [ ] Support advanced link types
- [ ] Preserve all metadata

### Phase 3: LogSeq (Future)
- [ ] Research LogSeq format
- [ ] Extend parser for block-based structure
- [ ] Test with sample LogSeq graph
- [ ] Document LogSeq-specific features

## Notes

- This feature significantly lowers the barrier to Signum adoption for existing note-takers
- Proper link preservation is critical - users won't tolerate broken connections
- Start with conservative file size limits, can increase based on performance testing
- Import is one-way for MVP; bidirectional sync is complex and deferred
- Consider making import history available for troubleshooting and user confidence
