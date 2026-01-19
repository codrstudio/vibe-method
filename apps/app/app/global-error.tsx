"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-md border border-gray-200 rounded-lg p-6 text-center bg-white shadow-sm">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2 text-gray-900">
              Erro Critico
            </h1>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro grave na aplicacao.
            </p>
            {isDev && error && (
              <pre className="mb-4 p-3 bg-gray-100 rounded text-xs text-left overflow-auto max-h-32 text-gray-800">
                {error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </button>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
