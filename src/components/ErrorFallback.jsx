export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-fallback">
      <div className="error-content">
        <h1>Etwas ist schiefgelaufen</h1>
        <p className="error-message">{error.message}</p>
        <details style={{ textAlign: 'left', marginBottom: 16, fontSize: '0.75rem', color: '#999' }}>
          <summary style={{ cursor: 'pointer' }}>Details (für Entwickler)</summary>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8 }}>
            {error.stack}
          </pre>
        </details>
        <button className="btn-primary" onClick={resetErrorBoundary}>
          Erneut versuchen
        </button>
      </div>
      <style>{`
        .error-fallback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fdfdfb;
          padding: 20px;
        }
        .error-content {
          text-align: center;
          max-width: 400px;
        }
        .error-fallback h1 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 12px;
        }
        .error-message {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 24px;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
