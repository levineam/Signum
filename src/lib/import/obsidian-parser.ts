/**
 * Obsidian Markdown Parser
 *
 * Converts Obsidian-flavored Markdown to Signum HTML format
 * Handles WikiLinks, frontmatter, tags, and standard Markdown
 *
 * Supported Markdown Syntax:
 * - Standard markdown: **bold**, *italic*, [links](url), # headings, lists, etc.
 * - ==Highlight== syntax (Obsidian) → <mark> tags
 * - [[WikiLinks]] (Obsidian) → converted to internal links post-import
 * - Frontmatter (YAML) → extracted to note metadata
 * - #tags → extracted to note tags
 *
 * Known Limitations (not currently supported):
 * - Obsidian callouts (> [!note] Title)
 * - Subscript (H~2~O) and superscript (x^2^) - not standard markdown
 * - Mermaid diagrams
 * - Math equations (LaTeX)
 * - Embedded files (![[image.png]])
 *
 * If you need support for additional syntax, check for remark plugins:
 * https://github.com/remarkjs/remark/blob/main/doc/plugins.md
 */

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';

export interface ParsedNote {
  title: string;
  content: string; // HTML format for Signum
  frontmatter: Record<string, unknown>;
  wikiLinks: WikiLink[];
  tags: string[];
  fileName: string;
  relativePath?: string; // Full path from vault root (e.g., "daily/note.md")
  originalContent: string; // Raw markdown for reference
}

export interface WikiLink {
  text: string; // Display text or note title
  target: string; // Target note title
  alias?: string; // Optional alias [[Note|alias]]
  isEmbed: boolean; // ![[Note]] = true
  position?: { start: number; end: number };
}

/**
 * Remark plugin to convert Obsidian ==highlight== syntax to <mark> tags
 *
 * This plugin runs AFTER markdown parsing, so markdown inside highlights
 * (like ==**bold**== or ==[link](url)==) is preserved and formatted correctly.
 *
 * The plugin walks the markdown AST and finds text nodes containing ==...==,
 * then replaces them with HTML nodes that will be parsed by rehype-raw.
 */
function remarkObsidianHighlight() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const highlightRegex = /==([^=]+)==/g;

      // Check if this text node contains highlight syntax
      if (!highlightRegex.test(text)) return;

      // Reset regex
      highlightRegex.lastIndex = 0;

      // Split the text into parts: plain text and highlights
      const parts: Array<{ type: 'text' | 'highlight'; value: string }> = [];
      let lastIndex = 0;
      let match;

      while ((match = highlightRegex.exec(text)) !== null) {
        // Add plain text before the highlight
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        // Add the highlight (without the == markers)
        parts.push({ type: 'highlight', value: match[1] });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining plain text after last highlight
      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
      }

      // Replace the text node with a mix of text and html nodes
      const newNodes = parts.map(part => {
        if (part.type === 'text') {
          return { type: 'text' as const, value: part.value };
        } else {
          // Create an html node that will be parsed by rehype-raw
          return {
            type: 'html' as const,
            value: `<mark>${part.value}</mark>`
          };
        }
      });

      // Replace the original node with the new nodes
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

export class ObsidianParser {
  /**
   * Parse a single Obsidian markdown file
   */
  async parseFile(
    fileName: string,
    content: string,
    relativePath?: string
  ): Promise<ParsedNote> {
    // Extract frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Extract title from frontmatter or filename
    const title = this.extractTitle(fileName, frontmatter);

    // Extract WikiLinks before conversion
    const wikiLinks = this.extractWikiLinks(markdownContent);

    // Extract tags from content and frontmatter
    const tags = this.extractTags(markdownContent, frontmatter);

    // Convert markdown to HTML
    const htmlContent = await this.convertToHtml(markdownContent);

    return {
      title,
      content: htmlContent,
      frontmatter,
      wikiLinks,
      tags,
      fileName,
      relativePath,
      originalContent: content,
    };
  }

  /**
   * Extract title from frontmatter or filename
   */
  private extractTitle(
    fileName: string,
    frontmatter: Record<string, unknown>
  ): string {
    // Priority: frontmatter title > frontmatter alias > filename
    if (frontmatter.title && typeof frontmatter.title === 'string') {
      return frontmatter.title;
    }

    if (frontmatter.alias && typeof frontmatter.alias === 'string') {
      return frontmatter.alias;
    }

    // Remove .md extension and clean filename
    return fileName
      .replace(/\.md$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }

  /**
   * Extract WikiLinks from markdown content
   * Supports: [[Note]], [[Note|Alias]], ![[Embed]]
   */
  private extractWikiLinks(content: string): WikiLink[] {
    const wikiLinks: WikiLink[] = [];

    // Regex for WikiLinks: !?[[target|alias?]]
    const wikiLinkRegex = /(!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g;

    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const isEmbed = match[1].startsWith('!');
      const target = match[2].trim();
      const alias = match[3]?.trim();

      wikiLinks.push({
        text: alias || target,
        target,
        alias,
        isEmbed,
        position: {
          start: match.index,
          end: match.index + match[0].length,
        },
      });
    }

    return wikiLinks;
  }

  /**
   * Extract tags from content (#tag) and frontmatter
   */
  private extractTags(
    content: string,
    frontmatter: Record<string, unknown>
  ): string[] {
    const tags = new Set<string>();

    // Extract from frontmatter
    if (frontmatter.tags) {
      const fmTags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : [frontmatter.tags];

      fmTags.forEach((tag) => {
        if (typeof tag === 'string') {
          tags.add(tag.replace(/^#/, '').toLowerCase());
        }
      });
    }

    // Extract from content (#tag format)
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.add(match[1].toLowerCase());
    }

    return Array.from(tags);
  }

  /**
   * Convert Markdown to HTML using remark
   */
  private async convertToHtml(markdown: string): Promise<string> {
    // First pass: Replace WikiLinks with placeholders to preserve them
    const wikiLinkPlaceholders: { placeholder: string; wikiLink: string }[] = [];
    let processedMarkdown = markdown;

    const wikiLinkRegex = /(!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g;
    let match;
    let placeholderIndex = 0;

    while ((match = wikiLinkRegex.exec(markdown)) !== null) {
      const placeholder = `%%%WIKILINK_${placeholderIndex}%%%`;
      const wikiLink = match[1];

      wikiLinkPlaceholders.push({ placeholder, wikiLink });
      processedMarkdown = processedMarkdown.replace(wikiLink, placeholder);
      placeholderIndex++;
    }

    // Second pass: Add space after markdown links followed immediately by text
    // Example: [02:22](url)we → [02:22](url) we
    processedMarkdown = processedMarkdown.replace(/\]\([^)]+\)([a-zA-Z])/g, (match, letter) => {
      return match.slice(0, -1) + ' ' + letter;
    });

    // Convert markdown to HTML
    // SECURITY: Use rehype-sanitize to prevent XSS attacks
    // This strips dangerous protocols (javascript:, data:) and unsafe HTML
    const file = await unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkObsidianHighlight) // Convert ==highlight== after markdown parsing (preserves nested markdown)
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert to rehype (HTML AST), allow raw HTML
      .use(rehypeRaw) // Parse raw HTML strings (like <mark>) into proper AST nodes
      .use(rehypeSanitize, {
        // Extend default schema to allow mark tag for highlights
        // Must spread defaultSchema to preserve all safe tags (p, h1, ul, li, a, etc.)
        ...defaultSchema,
        tagNames: [...(defaultSchema.tagNames || []), 'mark'],
      }) // Sanitize HTML with safe defaults + mark tag
      .use(rehypeStringify) // Convert back to HTML string
      .process(processedMarkdown);

    let html = String(file);

    // Second pass: Replace placeholders with WikiLink spans
    wikiLinkPlaceholders.forEach(({ placeholder, wikiLink }) => {
      const isEmbed = wikiLink.startsWith('!');
      const linkMatch = wikiLink.match(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);

      if (linkMatch) {
        const target = linkMatch[1].trim();
        const displayText = linkMatch[2]?.trim() || target;

        if (isEmbed) {
          // For embeds, create a special span (will be resolved to images later)
          html = html.replace(
            placeholder,
            `<span class="obsidian-embed" data-target="${this.escapeHtml(target)}">${this.escapeHtml(displayText)}</span>`
          );
        } else {
          // For regular links, create a span with data attributes (will be resolved to actual links after import)
          html = html.replace(
            placeholder,
            `<span class="obsidian-wikilink" data-target="${this.escapeHtml(target)}">${this.escapeHtml(displayText)}</span>`
          );
        }
      }
    });

    return html;
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

  /**
   * Validate file size and content
   */
  validateFile(fileName: string, size: number, content: string): {
    valid: boolean;
    error?: string;
  } {
    // Max file size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;

    if (size > MAX_SIZE) {
      return {
        valid: false,
        error: `File ${fileName} exceeds maximum size of 10MB`,
      };
    }

    // Must be .md file
    if (!fileName.toLowerCase().endsWith('.md')) {
      return {
        valid: false,
        error: `File ${fileName} is not a Markdown file`,
      };
    }

    // Basic content validation
    if (!content || content.trim().length === 0) {
      return {
        valid: false,
        error: `File ${fileName} is empty`,
      };
    }

    return { valid: true };
  }
}

/**
 * Singleton instance
 */
export const obsidianParser = new ObsidianParser();
