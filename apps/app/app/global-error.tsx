"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erro Critico</h1>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Ocorreu um erro grave na aplicacao.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Tentar novamente
              </button>
              <a
                href="/"
                style={{ padding: '0.5rem 1rem', backgroundColor: '#fff', color: '#000', border: '1px solid #ddd', borderRadius: '0.375rem', textDecoration: 'none' }}
              >
                Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
