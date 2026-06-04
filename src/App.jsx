import { useState, useEffect, useCallback, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SlotMachine from './components/SlotMachine';
import WinnerDisplay from './components/WinnerDisplay';
import WinnerHistory from './components/WinnerHistory';
import { useRaffle } from './hooks/useRaffle';
import { useAudio } from './hooks/useAudio';
import { exportWinnersCsv } from './utils/exportWinners';
import { clearAll as clearAllStorage, loadJson, saveJson } from './utils/storage';
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

// localStorage keys (read/written via utils/storage which version-namespaces them).
// useRaffle owns the raffle data slice; App owns these lightweight UI inputs.
const PRIZES_TEXT_KEY = 'prizesText';

function App() {
  const [fileData, setFileData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [columnError, setColumnError] = useState(null);
  // Lazy initializer so we only hit localStorage once on mount.
  const [prizesText, setPrizesText] = useState(() => loadJson(PRIZES_TEXT_KEY, ''));
  const [step, setStep] = useState('upload'); // upload | configure | ready
  // True only on this very first render if we found a restored raffle in
  // progress. Lets us show the "Restored from earlier session" banner.
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const slotRef = useRef(null);

  const {
    allParticipants,
    remainingParticipants,
    winners,
    currentWinner,
    currentPrize,
    allPrizesAwarded,
    prizeProgress,
    isSpinning,
    showWinner,
    sessionId,
    setIsSpinning,
    setPrizes,
    loadParticipants,
    pickWinner,
    confirmWinner,
    dismissWinner,
    resetRaffle,
    clearAll: clearRaffleState,
  } = useRaffle();

  const { playTick, playFanfare } = useAudio();

  // On first mount, if useRaffle restored an in-progress raffle from
  // localStorage, jump straight to the ready step and surface a banner so the
  // user knows their previous state was recovered. Runs once.
  useEffect(() => {
    if (allParticipants.length > 0) {
      setStep('ready');
      setShowRestoredBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist prizesText whenever it changes so the textarea round-trips a
  // refresh. useRaffle handles its own slice independently.
  useEffect(() => {
    saveJson(PRIZES_TEXT_KEY, prizesText);
  }, [prizesText]);

  const handleFileParsed = useCallback((data) => {
    setFileData(data);
    setSelectedColumn('');
    setColumnError(null);
    setShowRestoredBanner(false);
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
      // Parse the (optional) prize list: one prize per line. Blank lines are
      // dropped inside useRaffle.setPrizes — we just need to split here.
      const prizeList = prizesText
        .split(/\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      setPrizes(prizeList);
      loadParticipants(names);
      setShowRestoredBanner(false);
      setStep('ready');
    },
    [fileData, loadParticipants, prizesText, setPrizes]
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

  const handleExport = useCallback(() => {
    exportWinnersCsv(winners, { eventName: EVENT_NAME, eventDate: EVENT_DATE });
  }, [winners]);

  const handleNewFile = useCallback(() => {
    setFileData(null);
    setSelectedColumn('');
    setColumnError(null);
    setPrizesText('');
    setShowRestoredBanner(false);
    clearRaffleState();
    clearAllStorage();
    setStep('upload');
  }, [clearRaffleState]);

  // Same as Load New File but with a confirm() prompt because it can't be
  // undone — used by the restored-session banner's "Start fresh" button.
  const handleStartFresh = useCallback(() => {
    const ok = window.confirm(
      'Start fresh? This will discard the restored raffle (participants, prizes, and winners) and return to the upload screen.'
    );
    if (!ok) return;
    handleNewFile();
  }, [handleNewFile]);

  const dismissRestoredBanner = useCallback(() => {
    setShowRestoredBanner(false);
  }, []);

  // Keyboard shortcuts for stage use:
  //   Space  → spin (when ready, idle, no overlay, pool & prizes remain)
  //   Esc    → dismiss the winner overlay
  //   R      → reset raffle (only on ready step, idle, with at least one winner)
  //   E      → export winners to CSV (only with at least one winner)
  // Shortcuts are ignored while focus is on an interactive form element so we
  // don't hijack typing in the prize textarea or column selector.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const tag = target?.tagName;
      const typingInFormField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable;

      // Esc works even when a button is focused (e.g. the winner overlay's Continue button).
      if (e.code === 'Escape' && showWinner) {
        dismissWinner();
        return;
      }

      // The remaining shortcuts are letter/space keys — skip if the user is typing.
      if (typingInFormField) return;
      // Also skip when a button has focus so Space/Enter on that button still works natively.
      if (tag === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;

      if (
        e.code === 'Space' &&
        step === 'ready' &&
        !isSpinning &&
        !showWinner &&
        !allPrizesAwarded &&
        remainingParticipants.length > 0
      ) {
        e.preventDefault();
        slotRef.current?.spin();
        return;
      }

      if (
        e.code === 'KeyR' &&
        step === 'ready' &&
        !isSpinning &&
        !showWinner &&
        winners.length > 0
      ) {
        e.preventDefault();
        handleReset();
        return;
      }

      if (
        e.code === 'KeyE' &&
        step === 'ready' &&
        !isSpinning &&
        !showWinner &&
        winners.length > 0
      ) {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    step,
    isSpinning,
    showWinner,
    allPrizesAwarded,
    remainingParticipants.length,
    winners.length,
    dismissWinner,
    handleReset,
    handleExport,
  ]);

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

              <details className="prizes-field">
                <summary className="prizes-summary">
                  <span className="prizes-summary-title">🎁 Award specific prizes?</span>
                  <span className="prizes-summary-hint">optional</span>
                </summary>
                <label htmlFor="prizes-input" className="prizes-hint prizes-hint--inset">
                  One prize per line — winners are drawn in order. Leave blank
                  for a generic raffle.
                </label>
                <textarea
                  id="prizes-input"
                  className="prizes-input"
                  value={prizesText}
                  onChange={(e) => setPrizesText(e.target.value)}
                  placeholder={'Grand prize: Surface Pro\nXbox Series X\n$50 gift card'}
                  rows={4}
                  spellCheck={false}
                />
              </details>

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
              {showRestoredBanner && (
                <div className="restored-banner" role="status">
                  <span className="restored-banner-icon" aria-hidden="true">📂</span>
                  <span className="restored-banner-text">
                    Restored your previous raffle —{' '}
                    <strong>{allParticipants.length}</strong> participant
                    {allParticipants.length !== 1 ? 's' : ''},{' '}
                    <strong>{winners.length}</strong> winner
                    {winners.length !== 1 ? 's' : ''} drawn.
                  </span>
                  <button
                    type="button"
                    className="restored-banner-action"
                    onClick={handleStartFresh}
                  >
                    Start fresh
                  </button>
                  <button
                    type="button"
                    className="restored-banner-dismiss"
                    onClick={dismissRestoredBanner}
                    aria-label="Dismiss restored session notice"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="participant-count">
                <span className="count-number">
                  {remainingParticipants.length}
                </span>
                <span className="count-label">
                  participant{remainingParticipants.length !== 1 ? 's' : ''}{' '}
                  remaining
                </span>
              </div>

              {currentPrize && !allPrizesAwarded && (
                <div className="prize-banner" aria-live="polite">
                  <span className="prize-banner-progress">
                    Prize {prizeProgress.current} of {prizeProgress.total}
                  </span>
                  <span className="prize-banner-name">
                    <span aria-hidden="true">🎁</span> {currentPrize}
                  </span>
                </div>
              )}

              {allPrizesAwarded && (
                <div className="prize-banner prize-banner--done" role="status">
                  <span aria-hidden="true">🎉</span> All {prizeProgress.total}{' '}
                  prizes have been awarded!
                </div>
              )}

              <SlotMachine
                ref={slotRef}
                key={sessionId}
                participants={remainingParticipants}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
                pickWinner={pickWinner}
                playTick={playTick}
                disabled={showWinner || allPrizesAwarded}
              />

              <div className="controls-bar">
                <button className="secondary-button" onClick={handleNewFile}>
                  📂 Load New File
                </button>
                {winners.length > 0 && (
                  <>
                    <button
                      className="secondary-button"
                      onClick={handleExport}
                      title="Download winners as CSV"
                      aria-keyshortcuts="E"
                    >
                      📥 Export Winners
                    </button>
                    <button
                      className="secondary-button"
                      onClick={handleReset}
                      aria-keyshortcuts="R"
                    >
                      ↺ Reset Raffle
                    </button>
                  </>
                )}
              </div>

              <div className="shortcuts-hint" aria-label="Keyboard shortcuts">
                <kbd>Space</kbd> spin
                <span className="shortcuts-sep" aria-hidden="true">·</span>
                <kbd>Esc</kbd> dismiss
                <span className="shortcuts-sep" aria-hidden="true">·</span>
                <kbd>R</kbd> reset
                <span className="shortcuts-sep" aria-hidden="true">·</span>
                <kbd>E</kbd> export
              </div>
            </div>
          )}
        </div>

        {/* Right side: winner history */}
        {step === 'ready' && (
          <aside className="sidebar">
            <WinnerHistory
              winners={winners}
              onReset={handleReset}
              onExport={handleExport}
            />
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
        prize={winners[winners.length - 1]?.prize ?? null}
        show={showWinner}
        onDismiss={dismissWinner}
        drawNumber={winners.length}
      />
    </div>
  );
}

export default App;
