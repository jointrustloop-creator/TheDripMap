/**
 * Operator-side one-off reply through the platform mailer (clean links).
 *   npx tsx scripts/_send-mail.ts --base https://www.thedripmap.com --to owner@clinic.ca --subject "Re: ..." --file reply.txt [--cc x@y.z]
 * Body comes from a text file so quoting is never an issue. Authenticates with ACTIVATION_RUN_TOKEN.
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

const args = process.argv.slice(2);
const val = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const BASE = (val('base') || '').replace(/\/$/, '');
const TOKEN = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
const to = val('to'); const subject = val('subject'); const file = val('file');
if (!BASE || !TOKEN || !to || !subject || !file) { console.error('Need --base, --to, --subject, --file and ACTIVATION_RUN_TOKEN'); process.exit(1); }

async function main() {
  const text = fs.readFileSync(file!, 'utf8');
  const r = await fetch(`${BASE}/api/admin/send-mail`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ to, subject, text, cc: val('cc') }) });
  console.log(r.status, (await r.text()).slice(0, 400));
}
main().catch((e) => { console.error(e); process.exit(1); });
