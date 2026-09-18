/**
 * Plain text to email HTML, for operator replies and outreach.
 *
 * Lives in src/lib, NOT in the route that uses it: a Next.js route file may only
 * export HTTP handlers, and exporting a helper from one silently broke the
 * production build once already (notCanadianReason, 2026-09-11).
 *
 * Why the markdown-style link (2026-09-18): our private finish links are a UUID
 * plus a 32 character secret. Printed raw they wrap across lines, look like
 * spam, and tell the reader nothing. A draft can now write
 * [Finish your listing](https://...) and get a real labelled link, and a
 * paragraph that is nothing but one such link renders as a button.
 */
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MD_LINK = /\[([^\]\n]{1,80})\]\((https?:\/\/[^\s)]+)\)/g;
const LINK_STYLE = 'color:#0F6E56;text-decoration:underline;';
const BUTTON_STYLE = 'display:inline-block;background:#0F6E56;color:#FFFFFF;text-decoration:none;'
  + 'padding:13px 26px;border-radius:8px;font-size:15px;font-weight:600;';
const SLOT = (i: number) => `@@LINK${i}@@`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The recipient's plain-text copy must never contain markdown syntax. */
export function toPlainText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(MD_LINK, (_m, label, url) => `${label}: ${url}`);
}

/** A bare URL longer than this is shortened for display; the href stays whole. */
export function shortenForDisplay(url: string): string {
  if (url.length <= 62) return url;
  const stripped = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const slash = stripped.indexOf('/');
  const host = slash < 0 ? stripped : stripped.slice(0, slash);
  const path = slash < 0 ? '' : stripped.slice(slash);
  return `${host}${path.slice(0, 24)}...`;
}

export function textToHtml(text: string): string {
  const paras = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const body = paras.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';

    // A paragraph that is nothing but one labelled link becomes a button.
    const solo = trimmed.match(new RegExp(`^${MD_LINK.source}$`));
    if (solo) {
      return `<p style="margin:0 0 20px;"><a href="${escapeHtml(solo[2])}" style="${BUTTON_STYLE}">${escapeHtml(solo[1])}</a></p>`;
    }

    // Protect labelled links, linkify what is left, then restore. One pass
    // would re-linkify the href of a link we just built.
    const slots: string[] = [];
    const masked = trimmed.replace(MD_LINK, (_m, label, url) => {
      slots.push(`<a href="${escapeHtml(url)}" style="${LINK_STYLE}">${escapeHtml(label)}</a>`);
      return SLOT(slots.length - 1);
    });
    const esc = escapeHtml(masked).replace(/\n/g, '<br>');
    const linked = esc.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
      (u) => `<a href="${u}" style="${LINK_STYLE}">${escapeHtml(shortenForDisplay(u))}</a>`);
    const restored = linked.replace(/@@LINK(\d+)@@/g, (_m, i) => slots[Number(i)] || '');
    return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1A2B26;">${restored}</p>`;
  }).join('');
  return `<div style="font-family:${FONT};max-width:620px;font-size:15px;line-height:1.6;color:#1A2B26;">${body}</div>`;
}
