# AUTOPILOT approvals flag file

Scheduled routines read this file before doing anything that produces
output (Gmail drafts, onboarding sends). The operator edits this file
(or tells Claude to) to grant approvals. Until a flag is set to YES the
corresponding workflow runs in report-only mode.

TEMPLATE_A_OUTREACH_APPROVED: NO
TEMPLATE_B_ONBOARDING_APPROVED: NO

Approved template texts live in scripts/_autopilot-templates-for-approval.md.
Set a flag to YES only after reviewing that file. Record any edits there
before flipping.

History:
- 2026-06-12: file created with both flags NO (bootstrap step 5).
