/**
 * Utility to convert HTML content to clean Markdown based on specific rules.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // 1. Headers
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // 2. Links
  markdown = markdown.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // 3. Lists
  // Replace <li> within <ul>
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
  });
  // Replace <li> within <ol>
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n';
  });

  // 4. Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // 5. Paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // 6. Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // 7. Remove any remaining HTML tags (safety)
  markdown = markdown.replace(/<[^>]*>/g, '');

  // 8. Clean up whitespace
  markdown = markdown
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines

  return markdown.trim();
}

/**
 * Detects if a string contains common HTML tags.
 */
export function containsHtml(text: string): boolean {
  const htmlTags = /<p>|<h2>|<h3>|<strong>|<ul>|<li>|<ol>|<a\s/i;
  return htmlTags.test(text);
}
