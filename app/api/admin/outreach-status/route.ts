import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { countBySubject } from '../../../../src/lib/draft-saver';

// GET /api/admin/outreach-status
// Admin-only. Reports counts of outreach drafts + sent emails matching
// "listing on TheDripMap" in Gmail Drafts and Sent folders. Lets us
// verify state before/after batch sends.
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [drafts, sent] = await Promise.all([
      countBySubject('[Gmail]/Drafts', 'listing on TheDripMap'),
      countBySubject('[Gmail]/Sent Mail', 'listing on TheDripMap'),
    ]);
    return NextResponse.json({ ok: true, drafts, sent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
