// Build & trigger a CSV download of the winner list.
// Columns: #, Name, Prize, Drawn at (local ISO timestamp at download time).
//
// We don't store per-winner timestamps in state (the raffle hook keeps
// things simple), so the timestamp column reflects "exported at" rather
// than the original draw time. That's accurate enough for the post-event
// fulfillment / sponsor report use case this feature targets.

const CSV_HEADERS = ['#', 'Name', 'Prize', 'Exported at'];

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if the value contains a comma, quote, newline, or carriage return.
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(winners, exportedAtIso) {
  const rows = winners.map((w, i) =>
    [i + 1, w.name, w.prize ?? '', exportedAtIso].map(escapeCell).join(',')
  );
  // BOM so Excel opens UTF-8 correctly (handles accents in attendee names).
  return '\uFEFF' + [CSV_HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
}

function safeSlug(value, fallback) {
  const slug = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function buildWinnersFilename(eventName, eventDate, now = new Date()) {
  const dateSlug = safeSlug(eventDate, now.toISOString().slice(0, 10));
  const nameSlug = safeSlug(eventName, 'raffle');
  return `${nameSlug}-winners-${dateSlug}.csv`;
}

export function exportWinnersCsv(winners, { eventName, eventDate } = {}) {
  if (!Array.isArray(winners) || winners.length === 0) return false;

  const now = new Date();
  const csv = buildCsv(winners, now.toISOString());
  const filename = buildWinnersFilename(eventName, eventDate, now);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
