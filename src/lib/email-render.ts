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
  + 'padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.01em;';
const SLOT = (i: number) => `@@LINK${i}@@`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The recipient's plain-text copy must never contain markdown syntax. */
export function toPlainText(text: string, opts: RenderOptions = {}): string {
  const plain = text.replace(/\r\n/g, '\n').replace(MD_LINK, (_m, label, url) => `${label}: ${url}`);
  return opts.footerFor ? `${plain}\n\n--\n${complianceFooterText(opts.footerFor, opts.clinicName)}` : plain;
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

// The sign-off every operator email ends with. When the text ends with it,
// the renderer replaces those two lines with a proper signature block
// (Hubert 2026-09-18: "hoping button will show nice and trust signature").
const SIGNOFF = /^Deborah\n+Founder,?\s+TheDripMap\s*$/i;
const SIGNATURE_HTML =
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;border-top:1px solid #E6E2D8;padding-top:18px;">`
  + `<tr><td style="vertical-align:top;padding:18px 14px 0 0;">`
  + `<img src="https://www.thedripmap.com/icon-192.png" width="44" height="44" alt="TheDripMap" style="display:block;border-radius:10px;">`
  + `</td><td style="vertical-align:top;padding-top:18px;font-family:${FONT};">`
  + `<div style="font-size:15px;font-weight:700;color:#1A2B26;">Deborah</div>`
  + `<div style="font-size:13px;color:#5B6B66;margin-top:2px;">Founder, TheDripMap</div>`
  + `<div style="font-size:13px;margin-top:6px;"><a href="https://www.thedripmap.com" style="color:#0F6E56;text-decoration:none;">thedripmap.com</a>`
  + ` <span style="color:#B8B2A6;">&middot;</span> <a href="mailto:info@thedripmap.com" style="color:#0F6E56;text-decoration:none;">info@thedripmap.com</a></div>`
  + `<div style="font-size:12px;color:#8A948F;margin-top:6px;">Canada's matching platform for IV therapy clinics</div>`
  + `</td></tr></table>`;

const SITE = 'https://www.thedripmap.com';
const MAILING = 'TheDripMap, Caledon, Ontario, Canada';
const unsubUrl = (email: string) => `${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;

/**
 * The CASL block every operator email carries: who we are, a mailing address,
 * and a working one-click opt-out that writes to email_suppressions (the list
 * every send path reads). Added by the renderer itself so no script can forget
 * it again (Hubert 2026-09-19: the [TEST] had no unsubscribe paragraph; the
 * audit had already found 35 register and personal-note sends without one).
 */
export function complianceFooterText(recipientEmail: string, clinicName?: string | null): string {
  const because = clinicName
    ? `You are receiving this because ${clinicName} is listed on TheDripMap, the Canadian IV therapy matching platform.`
    : 'You are receiving this because you contacted TheDripMap or your clinic is listed on it, the Canadian IV therapy matching platform.';
  return `${because} ${MAILING}. To stop receiving these emails, unsubscribe here: ${unsubUrl(recipientEmail)}`;
}

function complianceFooterHtml(recipientEmail: string, clinicName?: string | null): string {
  const because = clinicName
    ? `You are receiving this because ${escapeHtml(clinicName)} is listed on TheDripMap, the Canadian IV therapy matching platform.`
    : 'You are receiving this because you contacted TheDripMap or your clinic is listed on it, the Canadian IV therapy matching platform.';
  return `<p style="margin:26px 0 0;padding-top:16px;border-top:1px solid #E6E2D8;font-size:12px;line-height:1.55;color:#8A948F;">`
    + `${because} ${escapeHtml(MAILING)}. `
    + `<a href="${escapeHtml(unsubUrl(recipientEmail))}" style="color:#8A948F;text-decoration:underline;">Unsubscribe</a> to stop receiving these emails.</p>`;
}

export interface RenderOptions {
  /** Recipient address; when present the CASL footer with a one-click opt-out is appended. */
  footerFor?: string | null;
  clinicName?: string | null;
}

export function textToHtml(text: string, opts: RenderOptions = {}): string {
  const paras = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const body = paras.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';

    if (SIGNOFF.test(trimmed)) return SIGNATURE_HTML;

    // A paragraph that is nothing but one labelled link becomes a button.
    const solo = trimmed.match(new RegExp(`^${MD_LINK.source}$`));
    if (solo) {
      return `<p style="margin:8px 0 26px;"><a href="${escapeHtml(solo[2])}" style="${BUTTON_STYLE}">${escapeHtml(solo[1])}</a></p>`;
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
    return `<p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#1A2B26;">${restored}</p>`;
  }).join('');
  // A quiet card on the site's cream ground: readable line length, real
  // padding, and the same look in Gmail, Outlook and Apple Mail.
  return `<div style="background:#F8F5EE;padding:28px 16px;font-family:${FONT};">`
    + `<div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E6E2D8;border-radius:14px;padding:32px 36px;font-size:15px;line-height:1.65;color:#1A2B26;">`
    + body
    + (opts.footerFor ? complianceFooterHtml(opts.footerFor, opts.clinicName) : '')
    + `</div></div>`;
}
