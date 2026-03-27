export default function ColumnSelector({ columns, selectedColumn, onSelect }) {
  return (
    <div className="column-selector">
      <label htmlFor="col-select">Select the name column:</label>
      <select
        id="col-select"
        value={selectedColumn}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Choose column --</option>
        {columns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  );
}
