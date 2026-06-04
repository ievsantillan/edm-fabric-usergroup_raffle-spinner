import { useState, useEffect, useCallback, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SlotMachine from './components/SlotMachine';
import WinnerDisplay from './components/WinnerDisplay';
import WinnerHistory from './components/WinnerHistory';
import { useRaffle } from './hooks/useRaffle';
import { useAudio } from './hooks/useAudio';
import './App.css';

// ─────────────────────────────────────────────────────────────────────────────
// EVENT METADATA — update these three values for each new event.
// EVENT_DATE accepts any value Date can parse (ISO format recommended).
// The header subtitle is rendered as: `{EVENT_TAGLINE} · {formatted EVENT_DATE}`.
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_NAME = 'Edmonton Fabric User Group';
const EVENT_TAGLINE = 'Global Fabric Day Raffle';
const EVENT_DATE = '2026-06-27'; // YYYY-MM-DD

const EVENT_DATE_LABEL = new Date(`${EVENT_DATE}T00:00:00`).toLocaleDateString(
  'en-US',
  { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
);
const EVENT_SUBTITLE = `${EVENT_TAGLINE} · ${EVENT_DATE_LABEL}`;

function App() {
  const [fileData, setFileData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [columnError, setColumnError] = useState(null);
  const [step, setStep] = useState('upload'); // upload | configure | ready
  const slotRef = useRef(null);

  const {
    remainingParticipants,
    winners,
    currentWinner,
    isSpinning,
    showWinner,
    sessionId,
    setIsSpinning,
    loadParticipants,
    pickWinner,
    confirmWinner,
    dismissWinner,
    resetRaffle,
  } = useRaffle();

  const { playTick, playFanfare } = useAudio();

  const handleFileParsed = useCallback((data) => {
    setFileData(data);
    setSelectedColumn('');
    setColumnError(null);
    setStep('configure');
  }, []);

  const handleColumnSelect = useCallback(
    (col) => {
      setSelectedColumn(col);
      setColumnError(null);
      if (!col || !fileData) return;
      const names = fileData.rows
        .map((row) => row[col])
        .filter((n) => n && String(n).trim());
      if (names.length === 0) {
        setColumnError(
          'No valid names found in this column. Pick a different column.'
        );
        return;
      }
      loadParticipants(names);
      setStep('ready');
    },
    [fileData, loadParticipants]
  );

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
  }, [setIsSpinning]);

  const handleSpinEnd = useCallback(
    (winner) => {
      setIsSpinning(false);
      playFanfare();
      confirmWinner(winner);
    },
    [setIsSpinning, playFanfare, confirmWinner]
  );

  const handleReset = useCallback(() => {
    resetRaffle();
  }, [resetRaffle]);

  const handleNewFile = useCallback(() => {
    setFileData(null);
    setSelectedColumn('');
    setColumnError(null);
    setStep('upload');
    resetRaffle();
  }, [resetRaffle]);

  // Spacebar to spin, Escape to dismiss winner overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === 'Space' &&
        step === 'ready' &&
        !isSpinning &&
        !showWinner &&
        remainingParticipants.length > 0
      ) {
        // Ignore Space when focus is on an input/textarea/select/button (avoid hijacking native behaviour)
        const target = e.target;
        const tag = target?.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON'
        ) {
          return;
        }
        e.preventDefault();
        slotRef.current?.spin();
      }
      if (e.code === 'Escape' && showWinner) {
        dismissWinner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, isSpinning, showWinner, remainingParticipants.length, dismissWinner]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <img
            src={`${import.meta.env.BASE_URL}edm_fabusergroup.png`}
            alt="Edmonton Fabric Users Group"
            className="header-logo"
          />
          <div className="header-text">
            <h1 className="header-title">{EVENT_NAME}</h1>
            <p className="header-subtitle">{EVENT_SUBTITLE}</p>
          </div>
          <a
            className="header-logo-link"
            href="https://globalfabric.community/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit the Global Fabric Community website"
          >
            <img
              src={`${import.meta.env.BASE_URL}global-fabric-community-logo.svg`}
              alt="Global Fabric Community"
              className="header-logo header-logo-right"
            />
          </a>
        </div>
      </header>

      <main className="app-main">
        {/* Left side: controls / spinner */}
        <div className="main-content">
          {step === 'upload' && (
            <div className="upload-step">
              <h2 className="step-title">Load Participants</h2>
              <p className="step-description">
                Upload a CSV or Excel file with participant names to get started.
              </p>
              <FileUpload onFileParsed={handleFileParsed} />
            </div>
          )}

          {step === 'configure' && fileData && (
            <div className="configure-step">
              <h2 className="step-title">Configure</h2>
              <p className="step-description">
                Found <strong>{fileData.rows.length}</strong> rows with{' '}
                <strong>{fileData.columns.length}</strong> columns. Select the
                column containing participant names.
              </p>
              <ColumnSelector
                columns={fileData.columns}
                selectedColumn={selectedColumn}
                onSelect={handleColumnSelect}
              />
              {columnError && (
                <p className="error-message" role="alert">
                  {columnError}
                </p>
              )}
            </div>
          )}

          {step === 'ready' && (
            <div className="ready-step">
              <div className="participant-count">
                <span className="count-number">
                  {remainingParticipants.length}
                </span>
                <span className="count-label">
                  participant{remainingParticipants.length !== 1 ? 's' : ''}{' '}
                  remaining
                </span>
              </div>

              <SlotMachine
                ref={slotRef}
                key={sessionId}
                participants={remainingParticipants}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
                pickWinner={pickWinner}
                playTick={playTick}
                disabled={showWinner}
              />

              <div className="controls-bar">
                <button className="secondary-button" onClick={handleNewFile}>
                  📂 Load New File
                </button>
                {winners.length > 0 && (
                  <button className="secondary-button" onClick={handleReset}>
                    ↺ Reset Raffle
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: winner history */}
        {step === 'ready' && (
          <aside className="sidebar">
            <WinnerHistory winners={winners} onReset={handleReset} />
            {winners.length === 0 && (
              <div className="sidebar-empty">
                <p>No winners yet.</p>
                <p className="sidebar-hint">
                  Press <kbd>Space</kbd> or click SPIN to draw!
                </p>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Winner celebration overlay */}
      <WinnerDisplay
        winner={currentWinner}
        show={showWinner}
        onDismiss={dismissWinner}
        drawNumber={winners.length}
      />
    </div>
  );
}

export default App;
