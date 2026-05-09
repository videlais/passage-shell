import { useMemo, useState } from 'react';

function formatLogLine(log) {
  const stamp = new Date(log.at).toLocaleTimeString();

  if (log.type === 'action-start') {
    return `${stamp} [${log.index + 1}/${log.total}] Starting ${log.description || log.action}`;
  }

  if (log.type === 'action-success') {
    return `${stamp} [${log.index + 1}/${log.total}] Completed ${log.description || log.action}`;
  }

  if (log.type === 'action-error') {
    return `${stamp} [${log.index + 1}] Failed ${log.description || log.action}: ${log.message}`;
  }

  return `${stamp} ${JSON.stringify(log)}`;
}

export default function App() {
  const [htmlFile, setHtmlFile] = useState(null);
  const [actionsFile, setActionsFile] = useState(null);
  const [slowMo, setSlowMo] = useState(0);
  const [headless, setHeadless] = useState(true);
  const [verbose, setVerbose] = useState(false);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const logLines = useMemo(() => {
    return (response?.logs || []).map((log) => formatLogLine(log));
  }, [response]);

  const runActions = async (event) => {
    event.preventDefault();

    if (!htmlFile || !actionsFile) {
      setError('Please provide one HTML file and one JSON actions file.');
      return;
    }

    setRunning(true);
    setError('');
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append('htmlFile', htmlFile);
      formData.append('actionsFile', actionsFile);
      formData.append('slowMo', String(slowMo));
      formData.append('headless', String(headless));
      formData.append('verbose', String(verbose));

      const result = await fetch('/api/run', {
        method: 'POST',
        body: formData
      });

      const payload = await result.json();

      if (!result.ok) {
        setError(payload.error || 'Run failed.');
        return;
      }

      setResponse(payload);
      if (payload.error?.message) {
        setError(payload.error.message);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setRunning(false);
    }
  };

  const clearRun = () => {
    setResponse(null);
    setError('');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Passage Shell Web Runner</h1>
        <p>Upload a story HTML and action JSON, execute the run, and download screenshot artifacts.</p>
      </header>

      <main className="layout-grid">
        <section className="panel form-panel">
          <h2>Run Setup</h2>
          <form onSubmit={runActions}>
            <label>
              Story HTML file
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={(event) => setHtmlFile(event.target.files?.[0] || null)}
                required
              />
            </label>

            <label>
              Actions JSON file
              <input
                type="file"
                accept=".json,application/json"
                onChange={(event) => setActionsFile(event.target.files?.[0] || null)}
                required
              />
            </label>

            <label>
              Slow motion (ms)
              <input
                type="number"
                min="0"
                value={slowMo}
                onChange={(event) => setSlowMo(Number.parseInt(event.target.value || '0', 10))}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={headless}
                onChange={(event) => setHeadless(event.target.checked)}
              />
              Run headless
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={verbose}
                onChange={(event) => setVerbose(event.target.checked)}
              />
              Verbose console output
            </label>

            <div className="button-row">
              <button type="submit" disabled={running}>
                {running ? 'Running...' : 'Run Actions'}
              </button>
              <button type="button" onClick={clearRun} disabled={running} className="button-muted">
                Clear
              </button>
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}
          {response ? (
            <p className={response.status === 'completed' ? 'status-ok' : 'status-fail'}>
              Run status: {response.status}
            </p>
          ) : null}
        </section>

        <section className="panel">
          <h2>Console</h2>
          <div className="console-area" role="log" aria-live="polite">
            {logLines.length === 0 ? <p>No logs yet.</p> : logLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
          </div>
        </section>

        <section className="panel">
          <h2>Action Results</h2>
          <div className="results-area">
            {!response?.results?.length ? (
              <p>No action results yet.</p>
            ) : (
              response.results.map((result, index) => (
                <article key={`${result.action}-${index}`} className="result-card">
                  <h3>
                    {index + 1}. {result.description || result.action}
                  </h3>
                  <pre>{JSON.stringify(result.result, null, 2)}</pre>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Screenshots</h2>
          <div className="screenshot-grid">
            {!response?.screenshots?.length ? (
              <p>No screenshots generated.</p>
            ) : (
              response.screenshots.map((shot) => (
                <article key={shot.id} className="shot-card">
                  <img src={shot.url} alt={shot.fileName} loading="lazy" />
                  <div className="shot-meta">
                    <span>{shot.fileName}</span>
                    <a href={`${shot.url}?download=1`} download={shot.fileName}>
                      Download
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
