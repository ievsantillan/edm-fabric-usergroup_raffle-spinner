// ─────────────────────────────────────────────────────────────────────────────
// EVENT METADATA
//
// 👋 Forking this for another user group? These are the only three values you
// need to change here. Everything else (page title, OG tags, screenshots,
// etc.) lives in README.md / index.html / public/ — see the "Use this
// template" section of the README for the full checklist.
//
// EVENT_DATE accepts any value `new Date()` can parse (ISO YYYY-MM-DD
// recommended). The header subtitle is rendered as:
//   `{EVENT_TAGLINE} · {formatted EVENT_DATE}`
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT_NAME = 'Edmonton Fabric User Group';
export const EVENT_TAGLINE = 'Global Fabric Day Raffle';
export const EVENT_DATE = '2026-06-27'; // YYYY-MM-DD

const EVENT_DATE_LABEL = new Date(`${EVENT_DATE}T00:00:00`).toLocaleDateString(
  'en-US',
  { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
);

export const EVENT_SUBTITLE = `${EVENT_TAGLINE} · ${EVENT_DATE_LABEL}`;
