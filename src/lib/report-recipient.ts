/**
 * Where operator-facing reports go (daily digest, weekly report, SEO health,
 * outreach summaries, flow smoke).
 *
 * Set DIGEST_EMAIL_TO in Vercel to the operator's primary inbox. Falls back to
 * info@thedripmap.com so behaviour is unchanged until it is set. Clinic-facing
 * mail never uses this: it always comes from and replies to info@thedripmap.com.
 */
export const REPORT_TO = process.env.DIGEST_EMAIL_TO || 'info@thedripmap.com';
