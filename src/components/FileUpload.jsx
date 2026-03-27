import { useCallback, useState, useRef } from 'react';

export default function FileUpload({ onFileParsed }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const ACCEPTED = '.csv,.xlsx,.xls';

  const handleFile = useCallback(
    async (file) => {
      setError(null);
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        setError('Please upload a .csv, .xlsx, or .xls file.');
        return;
      }
      setFileName(file.name);
      try {
        const { parseFile } = await import('../utils/fileParser');
        const result = await parseFile(file);
        onFileParsed(result);
      } catch (e) {
        setError(e.message);
      }
    },
    [onFileParsed]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="file-upload-section">
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <div className="drop-icon">📂</div>
        {fileName ? (
          <p className="file-name">
            Loaded: <strong>{fileName}</strong>
          </p>
        ) : (
          <>
            <p className="drop-text">
              Drop your CSV or Excel file here
            </p>
            <p className="drop-subtext">or click to browse</p>
          </>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
