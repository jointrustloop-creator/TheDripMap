import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { deleteAllFromFolder, createLabel } from '../../../../src/lib/draft-saver';

// POST /api/admin/gmail-cleanup
// Admin-only. Cleans info@thedripmap.com Gmail:
//  - Deletes all messages from INBOX (test emails)
//  - Deletes all messages from [Gmail]/Drafts (cron sends automatically now)
//  - Creates labels: Outreach - Sent, Outreach - Replied, Claim Requests,
//    Upgrade Requests, Important
//
// The Gmail filter that auto-labels replies cannot be set via IMAP — must be
// configured manually in the Gmail web UI (instructions returned in response).
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const labels = [
    'Outreach - Sent',
    'Outreach - Replied',
    'Claim Requests',
    'Upgrade Requests',
    'Important Notes',
  ];

  const labelResults: Record<string, { created: boolean; error?: string }> = {};
  for (const name of labels) {
    try {
      const r = await createLabel(name);
      labelResults[name] = r;
    } catch (err) {
      labelResults[name] = {
        created: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  let inboxDeleted = 0;
  let inboxError: string | undefined;
  try {
    inboxDeleted = await deleteAllFromFolder('INBOX');
  } catch (err) {
    inboxError = err instanceof Error ? err.message : String(err);
  }

  let draftsDeleted = 0;
  let draftsError: string | undefined;
  try {
    draftsDeleted = await deleteAllFromFolder('[Gmail]/Drafts');
  } catch (err) {
    draftsError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: true,
    inboxDeleted,
    inboxError,
    draftsDeleted,
    draftsError,
    labels: labelResults,
    manualStep: {
      reason: 'Gmail filters cannot be set via IMAP — must be configured in Gmail web UI.',
      filterToCreate: {
        criteria: 'subject:thedripmap',
        action: 'Apply label "Outreach - Replied"',
        path: 'Gmail → Settings → Filters and Blocked Addresses → Create a new filter',
      },
    },
  });
}
