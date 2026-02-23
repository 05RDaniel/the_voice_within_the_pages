/**
 * Chapter parsing for plain-text stories stored as a single string.
 * Chapters are defined by the tag: <separator>Chapter Title</separator>
 */

/**
 * Regex to detect a chapter separator tag.
 * Matches <separator>Title</separator> - the title can contain any chars except <.
 */
export const CHAPTER_DELIMITER_REGEX = /<separator>([^<]*)<\/separator>/g;

/**
 * Parses a full story text into structured chapters.
 * Delimiter format: <separator>Chapter Title</separator>
 * The tag can be styled when rendering to subtly distinguish separators.
 *
 * @param {string} fullText - The entire story content as a single string
 * @returns {Array<{ title: string, content: string, index: number }>}
 */
export function parseChapters(fullText) {
  if (typeof fullText !== 'string') {
    return [{ title: '', content: '', index: 0 }];
  }

  const headers = [];
  const regex = new RegExp(CHAPTER_DELIMITER_REGEX.source, 'g');
  for (const match of fullText.matchAll(regex)) {
    headers.push({
      index: match.index,
      title: match[1].trim(),
      fullLength: match[0].length
    });
  }

  if (headers.length === 0) {
    return [{ title: '', content: fullText.trim(), index: 0 }];
  }

  const chapters = [];

  // Content before the first delimiter (optional intro)
  const beforeFirst = fullText.slice(0, headers[0].index).trim();
  if (beforeFirst.length > 0) {
    chapters.push({ title: '', content: beforeFirst, index: 0 });
  }

  for (let i = 0; i < headers.length; i++) {
    const contentStart = headers[i].index + headers[i].fullLength;
    const contentEnd = i + 1 < headers.length ? headers[i + 1].index : fullText.length;
    const content = fullText.slice(contentStart, contentEnd).trim();
    chapters.push({
      title: headers[i].title,
      content,
      index: chapters.length
    });
  }

  return chapters;
}

/**
 * Rebuilds full story text from an array of chapters.
 * Use when saving after editing by chapter.
 *
 * @param {Array<{ title: string, content: string }>} chapters
 * @returns {string}
 */
export function chaptersToFullText(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return '';
  }
  return chapters
    .map((ch) => {
      const head = ch.title ? `<separator>${ch.title}</separator>\n\n` : '';
      return head + (ch.content || '').trim();
    })
    .join('\n\n')
    .trim();
}

/**
 * Splits text into segments for styled rendering. Use when displaying content
 * to apply .chapter-separator CSS to separator tags without making them obvious.
 *
 * @param {string} text - Full story text
 * @returns {Array<{ type: 'text'|'separator', value: string }>}
 */
export function splitForStyledRender(text) {
  if (typeof text !== 'string') return [{ type: 'text', value: '' }];
  const regex = new RegExp(CHAPTER_DELIMITER_REGEX.source, 'g');
  const result = [];
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    result.push({ type: 'separator', value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return result.length ? result : [{ type: 'text', value: text }];
}

/*
  Example input:

    const input = `A short prologue.

<separator>Chapter One</separator>

First chapter body. It can have many lines.

<separator>Chapter Two</separator>

Second chapter.`;

  Example output (parseChapters(input)):

    [
      { title: '', content: 'A short prologue.', index: 0 },
      { title: 'Chapter One', content: 'First chapter body. It can have many lines.', index: 1 },
      { title: 'Chapter Two', content: 'Second chapter.', index: 2 }
    ]

  No delimiters: parseChapters("Just one block of text.")
    => [{ title: '', content: 'Just one block of text.', index: 0 }]
*/
