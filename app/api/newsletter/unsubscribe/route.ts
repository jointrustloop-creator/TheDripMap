/**
 * GET /api/newsletter/unsubscribe?e=<email>  (legacy query form)
 *
 * Kept for any link already sent with the ?e= form. New emails link the PATH
 * form (/api/newsletter/unsubscribe/<email>) because a query "=" gets mangled by
 * quoted-printable MIME encoding. Both share the same handler.
 */
import { handleUnsubscribe } from '../../../../src/lib/newsletter-unsubscribe';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handleUnsubscribe(url.searchParams.get('e'));
}
