// services/xmlComments.ts
import { AlignedComment } from './api';

/**
 * Parse a TEI XML comment file into AlignedComment[] for review mode.
 * Extracts <note type="comm"> elements with their target word IDs.
 */
export function parseXMLComments(xmlString: string): AlignedComment[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const ns = 'http://www.tei-c.org/ns/1.0';
  const notes = doc.getElementsByTagNameNS(ns, 'note');
  const comments: AlignedComment[] = [];
  let number = 1;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (note.getAttribute('type') !== 'comm') continue;

    const target = note.getAttribute('target') || '';
    const targetEnd = note.getAttribute('targetEnd') || '';

    const start = parseWordId(target);
    // Single-word comments have target but no targetEnd — use start as end
    const end = targetEnd ? parseWordId(targetEnd) : start;

    // Extract <ref> element content as the reference text
    const refEl = note.getElementsByTagNameNS(ns, 'ref')[0];
    const refText = refEl ? refEl.textContent || '' : '';

    // Extract the comment body: everything after <ref> in the note's text content
    // We get the full text and remove the ref portion
    const fullText = note.textContent || '';
    const comment = refEl
      ? fullText.substring((refEl.textContent || '').length).replace(/^:\s*/, '').trim()
      : fullText.trim();

    const status = (start !== null && end !== null) ? 'OK' : 'ERROR';

    comments.push({
      number,
      text: refText,
      comment,
      start,
      end,
      status,
    });

    number++;
  }

  return comments;
}

/**
 * Extract the numeric word ID from a target attribute value.
 * e.g. "quarantana/intro.xml#intro_10001" → 10001
 */
function parseWordId(target: string): number | null {
  if (!target) return null;
  const match = target.match(/#\w+_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract the chapter ID from a target attribute value.
 * e.g. "quarantana/intro.xml#intro_10001" → "intro"
 * e.g. "quarantana/cap1.xml#cap1_10001" → "cap1"
 */
export function parseChapterFromTarget(xmlString: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const ns = 'http://www.tei-c.org/ns/1.0';
  const notes = doc.getElementsByTagNameNS(ns, 'note');

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (note.getAttribute('type') !== 'comm') continue;
    const target = note.getAttribute('target') || '';
    // e.g. "quarantana/intro.xml#intro_10001" → "intro"
    const match = target.match(/quarantana\/(\w+)\.xml/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Patch the original XML string with updated alignments.
 * Uses string-level replacement to preserve original formatting,
 * quoting style, and all non-alignment content exactly as-is.
 */
export function patchXMLComments(
  originalXml: string,
  updatedComments: AlignedComment[]
): string {
  // Determine the target prefix from the first comm note
  const prefixMatch = originalXml.match(/target=["']([^"']*#\w+_)\d+["']/);
  if (!prefixMatch) return originalXml;
  const targetPrefix = prefixMatch[1];

  // Match each <note ... type="comm" or type='comm' ...> opening tag
  const notePattern = /<note\s[^>]*type=["']comm["'][^>]*>/g;

  let commentIndex = 0;
  const result = originalXml.replace(notePattern, (noteTag) => {
    const updated = updatedComments[commentIndex];
    commentIndex++;
    if (!updated || updated.start === null) return noteTag;

    // Replace target attribute value
    let patched = noteTag.replace(
      /target=["'][^"']*["']/,
      `target="${targetPrefix}${updated.start}"`
    );

    if (updated.end !== null && updated.end !== updated.start) {
      // Multi-word: update or add targetEnd
      if (/targetEnd=["']/.test(patched)) {
        patched = patched.replace(
          /targetEnd=["'][^"']*["']/,
          `targetEnd="${targetPrefix}${updated.end}"`
        );
      } else {
        // Add targetEnd before the closing >
        patched = patched.replace(/>$/, ` targetEnd="${targetPrefix}${updated.end}">`);
      }
    } else {
      // Single-word: remove targetEnd if present
      patched = patched.replace(/\s*targetEnd=["'][^"']*["']/, '');
    }

    return patched;
  });

  return result;
}
