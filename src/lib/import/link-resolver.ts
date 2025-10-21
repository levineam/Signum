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

    // Fetch all imported notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, content, metadata')
      .in('id', noteIds)
      .eq('user_id', userId);

    if (error || !notes) {
      console.error('Error fetching notes for link resolution:', error);
      return result;
    }

    // Build title -> noteId mapping
    const titleMap = new Map<string, string>();
    notes.forEach((note) => {
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
        const { error: updateError } = await supabase
          .from('notes')
          .update({ content: updatedContent })
          .eq('id', note.id);

        if (!updateError) {
          result.updatedNotes.push(note.id);
          result.resolvedCount += resolved;
        } else {
          console.error(`Error updating note ${note.id}:`, updateError);
        }
      }

      result.brokenLinks.push(...broken);
    }

    // Create link relationships in links table
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
        // Try exact match first, then case-insensitive
        const targetNoteId =
          titleMap.get(target) || titleMap.get(target.toLowerCase());

        if (targetNoteId) {
          // Resolved: Convert to proper link
          resolvedCount++;
          return `<a href="#" class="note-link" data-note-id="${targetNoteId}">${this.escapeHtml(displayText)}</a>`;
        } else {
          // Broken link: Keep as styled span
          brokenLinks.push({
            sourceNoteId: noteId,
            sourceTitle: noteTitle,
            targetTitle: target,
            wikiLink: `[[${target}]]`,
          });
          return `<span class="broken-link" data-target="${this.escapeHtml(target)}" title="Note not found: ${this.escapeHtml(target)}">${this.escapeHtml(displayText)}</span>`;
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
      const { error } = await supabase.from('links').insert(linksToCreate);

      if (error) {
        console.error('Error creating link relationships:', error);
      }
    }
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

/**
 * Singleton instance
 */
export const linkResolver = new LinkResolver();
