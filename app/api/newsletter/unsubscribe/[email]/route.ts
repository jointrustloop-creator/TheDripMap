/**
 * GET /api/newsletter/unsubscribe/<email>  (canonical path form)
 *
 * The address rides in the URL PATH, not a ?e= query, so it survives quoted-
 * printable MIME encoding intact (a query "=" would be read as an escape and
 * corrupt the address). This is the link every newsletter email uses.
 */
import { handleUnsubscribe } from '../../../../../src/lib/newsletter-unsubscribe';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ email: string }> }) {
  const { email } = await ctx.params;
  let decoded = email;
  try { decoded = decodeURIComponent(email); } catch { /* use raw if malformed */ }
  return handleUnsubscribe(decoded);
}
