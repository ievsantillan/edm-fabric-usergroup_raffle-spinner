import { useState, useEffect, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SlotMachine from './components/SlotMachine';
import WinnerDisplay from './components/WinnerDisplay';
import WinnerHistory from './components/WinnerHistory';
import { useRaffle } from './hooks/useRaffle';
import { useAudio } from './hooks/useAudio';
import './App.css';

function App() {
  const [fileData, setFileData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [step, setStep] = useState('upload'); // upload | configure | ready

  const {
    remainingParticipants,
    winners,
    currentWinner,
    isSpinning,
    showWinner,
    setIsSpinning,
    loadParticipants,
    confirmWinner,
    dismissWinner,
    resetRaffle,
  } = useRaffle();

  const { playTick, playFanfare } = useAudio();

  const handleFileParsed = useCallback((data) => {
    setFileData(data);
    setSelectedColumn('');
    setStep('configure');
  }, []);

  const handleColumnSelect = useCallback(
    (col) => {
      setSelectedColumn(col);
      if (col && fileData) {
        const names = fileData.rows.map((row) => row[col]);
        loadParticipants(names);
        setStep('ready');
      }
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
    setStep('upload');
    resetRaffle();
  }, [resetRaffle]);

  // Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === 'Space' &&
        step === 'ready' &&
        !isSpinning &&
        !showWinner &&
        remainingParticipants.length > 0
      ) {
        e.preventDefault();
        document.querySelector('.spin-button')?.click();
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
            src="/edm_fabusergroup.png"
            alt="Edmonton Fabric Users Group"
            className="header-logo"
          />
          <div>
            <h1 className="header-title">Edmonton Fabric User Group</h1>
            <p className="header-subtitle">Post FabCon Raffle &middot; Tuesday, Mar 31 &middot; 4:30 PM to 6:00 PM MDT</p>
          </div>
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
                participants={remainingParticipants}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
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
