import fs from 'fs';
import path from 'path';

// Define the conversion rules
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<a\s+href=\"(.*?)\">(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();
}

const filePath = path.join(process.cwd(), 'src/lib/mock-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Match everything inside export const MOCK_BLOG_POSTS: BlogPost[] = [ ... ];
const startMarker = 'export const MOCK_BLOG_POSTS: BlogPost[] = [';
const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
  // Simple check to find the closing bracket of the array
  // This is a bit fragile but should work for this specific file
  const rest = content.slice(startIndex);
  const endIndex = rest.lastIndexOf('];');
  
  if (endIndex !== -1) {
    const arrayContent = rest.slice(startMarker.length, endIndex);
    
    // Now we need to find the "content:" fields and replace their values
    // We'll use a regex that matches content: `...` including multi-line backticks
    const contentRegex = /content:\s*`([\s\S]*?)`/g;
    const newArrayContent = arrayContent.replace(contentRegex, (match, p1) => {
      const cleaned = htmlToMarkdown(p1);
      return `content: \`\n${cleaned}\n    \``;
    });
    
    const newContent = content.slice(0, startIndex + startMarker.length) + newArrayContent + rest.slice(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully updated MOCK_BLOG_POSTS in src/lib/mock-data.ts');
  }
}
