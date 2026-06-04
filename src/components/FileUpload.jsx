import { useCallback, useState, useRef } from 'react';

const ACCEPTED = '.csv,.xlsx,.xls';
const ACCEPTED_EXTS = ['csv', 'xlsx', 'xls'];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export default function FileUpload({ onFileParsed }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      setError(null);
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ACCEPTED_EXTS.includes(ext)) {
        setError('Please upload a .csv, .xlsx, or .xls file.');
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        setError(
          `File is ${mb} MB — too large. Please upload a file under 25 MB.`
        );
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

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

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

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    },
    [openPicker]
  );

  return (
    <div className="file-upload-section">
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV or Excel file with participant names"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={openPicker}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <div className="drop-icon" aria-hidden="true">📂</div>
        {fileName ? (
          <p className="file-name">
            Loaded: <strong>{fileName}</strong>
          </p>
        ) : (
          <>
            <p className="drop-text">Drop your CSV or Excel file here</p>
            <p className="drop-subtext">or click to browse</p>
          </>
        )}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
