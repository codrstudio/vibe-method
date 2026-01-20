"use client";

import "@/app/globals.css";
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
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Erro Critico</h1>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro grave na aplicacao.
            </p>
            {isDev && error && (
              <pre className="mb-4 p-3 bg-muted rounded-md text-xs text-left max-h-32 text-muted-foreground whitespace-pre-wrap break-all">
                {error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-muted hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
