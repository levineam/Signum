/**
 * Link Resolver
 *
 * Resolves WikiLinks to actual note IDs after import
 * Converts <span class="obsidian-wikilink"> to proper <a> tags
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface NoteMapping {
  title: string;
  noteId: string;
  originalFileName: string;
}

export interface LinkResolutionResult {
  resolvedCount: number;
  brokenLinks: BrokenLink[];
  updatedNotes: string[]; // Note IDs that were updated
}

export interface BrokenLink {
  sourceNoteId: string;
  sourceTitle: string;
  targetTitle: string;
  wikiLink: string;
}

export class LinkResolver {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Resolve all WikiLinks in imported notes
   * This runs AFTER all notes have been imported
   */
  async resolveLinks(
    userId: string,
    noteIds: string[]
  ): Promise<LinkResolutionResult> {
    const result: LinkResolutionResult = {
      resolvedCount: 0,
      brokenLinks: [],
      updatedNotes: [],
    };

    // Fetch imported notes in chunks to avoid URI length limits
    // PostgREST rejects queries with very long .in() clauses (414 URI Too Long)
    const CHUNK_SIZE = 100; // Safe chunk size for UUID arrays
    const notes = [];

    for (let i = 0; i < noteIds.length; i += CHUNK_SIZE) {
      const chunk = noteIds.slice(i, i + CHUNK_SIZE);
      const { data: chunkNotes, error } = await this.supabase
        .from('notes')
        .select('id, title, content, metadata')
        .in('id', chunk)
        .eq('user_id', userId);

      if (error || !chunkNotes) {
        console.error('Error fetching notes chunk for link resolution:', error);
        return result;
      }

      notes.push(...chunkNotes);
    }

    // Fetch ALL user notes to build comprehensive title map
    // This allows WikiLinks to resolve to existing notes, not just imported ones
    const { data: allNotes, error: allNotesError } = await this.supabase
      .from('notes')
      .select('id, title, metadata')
      .eq('user_id', userId);

    if (allNotesError || !allNotes) {
      console.error('Error fetching all notes for title mapping:', allNotesError);
      return result;
    }

    // Build title -> noteId mapping from entire user vault
    const titleMap = new Map<string, string>();
    allNotes.forEach((note) => {
      // Store both exact title and lowercase version for case-insensitive matching
      titleMap.set(note.title, note.id);
      titleMap.set(note.title.toLowerCase(), note.id);

      // Also map original filename if available
      const originalFileName = note.metadata?.originalFileName;
      if (originalFileName) {
        const fileTitle = originalFileName.replace(/\.md$/i, '');
        titleMap.set(fileTitle, note.id);
        titleMap.set(fileTitle.toLowerCase(), note.id);
      }

      // CRITICAL: Map relative path for folder-structured WikiLinks
      // This resolves links like [[daily/2024-01-01]] when folders are used
      const relativePath = note.metadata?.relativePath;
      if (relativePath) {
        const pathWithoutExt = relativePath.replace(/\.md$/i, '');
        titleMap.set(pathWithoutExt, note.id);
        titleMap.set(pathWithoutExt.toLowerCase(), note.id);
      }
    });

    // Process each note's content
    for (const note of notes) {
      if (!note.content.includes('obsidian-wikilink')) {
        continue; // Skip notes without WikiLinks
      }

      const { updatedContent, resolved, broken } = this.resolveNoteLinks(
        note.id,
        note.title,
        note.content,
        titleMap
      );

      if (updatedContent !== note.content) {
        // Update note with resolved links
        const { error: updateError } = await this.supabase
          .from('notes')
          .update({ content: updatedContent })
          .eq('id', note.id);

        if (!updateError) {
          result.updatedNotes.push(note.id);
          result.resolvedCount += resolved;
          // Update the note object with resolved content for link relationship creation
          note.content = updatedContent;
        } else {
          console.error(`Error updating note ${note.id}:`, updateError);
        }
      }

      result.brokenLinks.push(...broken);
    }

    // Create link relationships in links table
    // Notes array now contains updated content with resolved <a> tags
    await this.createLinkRelationships(userId, notes, titleMap);

    return result;
  }

  /**
   * Resolve WikiLinks in a single note's content
   */
  private resolveNoteLinks(
    noteId: string,
    noteTitle: string,
    content: string,
    titleMap: Map<string, string>
  ): {
    updatedContent: string;
    resolved: number;
    broken: BrokenLink[];
  } {
    let updatedContent = content;
    let resolvedCount = 0;
    const brokenLinks: BrokenLink[] = [];

    // Find all WikiLink spans
    const wikiLinkRegex = /<span class="obsidian-wikilink" data-target="([^"]+)">([^<]+)<\/span>/g;

    updatedContent = updatedContent.replace(
      wikiLinkRegex,
      (match, target, displayText) => {
        // Decode HTML entities from the data-target attribute
        // The parser escaped special characters like & → &amp;
        const decodedTarget = this.decodeHtml(target);
        const decodedDisplayText = this.decodeHtml(displayText);

        // Strip block/heading anchors (#...) before resolving
        // WikiLinks like [[Note#Heading]] or [[Note#^block]] should resolve to "Note"
        const anchorIndex = decodedTarget.indexOf('#');
        const noteTitle = anchorIndex !== -1 ? decodedTarget.substring(0, anchorIndex) : decodedTarget;
        const anchor = anchorIndex !== -1 ? decodedTarget.substring(anchorIndex) : '';

        // Try exact match first, then case-insensitive
        const targetNoteId =
          titleMap.get(noteTitle) || titleMap.get(noteTitle.toLowerCase());

        if (targetNoteId) {
          // Resolved: Convert to proper link
          // Note: We preserve the anchor in a data attribute but it's not used for navigation yet
          resolvedCount++;
          const anchorAttr = anchor ? ` data-anchor="${this.escapeHtml(anchor)}"` : '';
          return `<a href="#" class="note-link" data-note-id="${targetNoteId}"${anchorAttr}>${this.escapeHtml(decodedDisplayText)}</a>`;
        } else {
          // Broken link: Keep as styled span
          brokenLinks.push({
            sourceNoteId: noteId,
            sourceTitle: noteTitle,
            targetTitle: noteTitle, // Use stripped title for broken link tracking
            wikiLink: `[[${decodedTarget}]]`, // Keep full link for reference
          });
          return `<span class="broken-link" data-target="${this.escapeHtml(decodedTarget)}" title="Note not found: ${this.escapeHtml(noteTitle)}">${this.escapeHtml(decodedDisplayText)}</span>`;
        }
      }
    );

    return {
      updatedContent,
      resolved: resolvedCount,
      broken: brokenLinks,
    };
  }

  /**
   * Create link relationships in the links table
   */
  private async createLinkRelationships(
    userId: string,
    notes: Array<{ id: string; content: string }>,
    _titleMap: Map<string, string>
  ): Promise<void> {
    const linksToCreate: Array<{
      source_note_id: string;
      target_note_id: string;
      link_type: string;
      user_id: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (const note of notes) {
      // Extract all resolved links
      const linkRegex = /<a [^>]*data-note-id="([^"]+)"[^>]*>([^<]+)<\/a>/g;
      let match;

      while ((match = linkRegex.exec(note.content)) !== null) {
        const targetNoteId = match[1];
        const displayText = match[2];

        linksToCreate.push({
          source_note_id: note.id,
          target_note_id: targetNoteId,
          link_type: 'references',
          user_id: userId,
          metadata: {
            importedWikiLink: true,
            displayText,
          },
        });
      }
    }

    if (linksToCreate.length > 0) {
      // Batch insert links
      const { error } = await this.supabase.from('links').insert(linksToCreate);

      if (error) {
        console.error('Error creating link relationships:', error);
      }
    }
  }

  /**
   * Decode HTML entities
   */
  private decodeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    };

    return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => htmlEntities[entity] || entity);
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  }
}
