# AUTOPILOT approvals flag file

Scheduled routines read this file before doing anything that produces
output (Gmail drafts, onboarding sends). The operator edits this file
(or tells Claude to) to grant approvals. Until a flag is set to YES the
corresponding workflow runs in report-only mode.

TEMPLATE_A_OUTREACH_APPROVED: YES
TEMPLATE_B_ONBOARDING_APPROVED: YES

Approved template texts live in scripts/_autopilot-templates-for-approval.md.
Set a flag to YES only after reviewing that file. Record any edits there
before flipping.

History:
- 2026-06-12: file created with both flags NO (bootstrap step 5).
- 2026-06-12: operator approved B as-is and A with one copy edit (the
  complete-pages claim softened to "noticeably more clicks... we see it
  in our own data"). Both flags set YES.
