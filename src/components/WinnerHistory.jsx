export default function WinnerHistory({ winners, onReset }) {
  if (winners.length === 0) return null;

  return (
    <div className="winner-history">
      <div className="history-header">
        <h3>🏆 Winners</h3>
        <button className="reset-button" onClick={onReset} title="Reset raffle">
          ↺ Reset
        </button>
      </div>
      <ul className="history-list">
        {winners.map((w, i) => (
          <li key={`${w}-${i}`} className="history-item">
            <span className="history-number">#{i + 1}</span>
            <span className="history-name">{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
