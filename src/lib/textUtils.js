import React from 'react';

const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Parse markdown-style [text](url) links and literal <br> tags.
 * Returns an array of React elements.
 */
export function renderLinkedText(text, linkStyle = {}) {
  if (!text || typeof text !== 'string') return text || '';

  const TOKEN_REGEX = /\[([^\]]+)\]\(([^)]+)\)|<br\s*\/?>/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: linkStyle.color || '#04D1FC', textDecoration: 'underline', ...linkStyle }}
        >
          {match[1]}
        </a>
      );
    } else {
      parts.push(<br key={`br-${keyIdx++}`} />);
    }
    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length <= 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

/**
 * Convert markdown-style [text](url) links to HTML <a> tags.
 * For use in email/MJML export (string output).
 */
export function linksToHTML(text, color = '#04D1FC') {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(LINK_REGEX, (_, label, href) =>
    `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:${color};text-decoration:underline;">${label}</a>`
  );
}
