export default function WinnerHistory({ winners, onReset, onExport }) {
  if (winners.length === 0) return null;

  return (
    <div className="winner-history">
      <div className="history-header">
        <h3>🏆 Winners</h3>
        <div className="history-actions">
          {onExport && (
            <button
              className="reset-button"
              onClick={onExport}
              title="Export winners to CSV (E)"
              aria-keyshortcuts="E"
            >
              📥 Export
            </button>
          )}
          <button className="reset-button" onClick={onReset} title="Reset raffle (R)" aria-keyshortcuts="R">
            ↺ Reset
          </button>
        </div>
      </div>
      <ul className="history-list">
        {winners.map((w, i) => (
          <li key={w.id ?? `${w.name}-${i}`} className="history-item">
            <span className="history-number">#{i + 1}</span>
            <div className="history-text">
              <span className="history-name">{w.name}</span>
              {w.prize && (
                <span className="history-prize" title={w.prize}>
                  🎁 {w.prize}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
