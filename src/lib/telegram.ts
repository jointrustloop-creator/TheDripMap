// src/lib/telegram.ts
//
// Thin wrapper around the Telegram Bot API. Used by the daily-report and
// weekly-report crons to deliver a second copy of each summary to the
// operator's phone. NO-OP (with a warn) when env vars are missing so a
// half-configured deploy can't break the cron.
//
// Env:
//   TELEGRAM_BOT_TOKEN  — from @BotFather
//   TELEGRAM_CHAT_ID    — the operator's chat ID with the bot

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const TELEGRAM_TIMEOUT_MS = 10_000;

export interface TelegramResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

// Telegram caps a single message at 4096 chars. We split on paragraph
// boundaries when over to keep things readable.
function chunk(text: string, max = 3900): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n\n', max);
    if (cut < max / 2) cut = remaining.lastIndexOf('\n', max);
    if (cut < max / 2) cut = max;
    out.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trim();
  }
  if (remaining.length > 0) out.push(remaining);
  return out;
}

export async function sendTelegram(text: string, opts: { html?: boolean } = {}): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('sendTelegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping');
    return { ok: true, skipped: true };
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const parts = chunk(text);
  for (const part of parts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: part,
          parse_mode: opts.html ? 'HTML' : 'Markdown',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('sendTelegram non-OK', res.status, body.slice(0, 300));
        return { ok: false, error: `HTTP ${res.status}` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('sendTelegram fetch failed', msg);
      return { ok: false, error: msg };
    }
  }
  return { ok: true };
}
