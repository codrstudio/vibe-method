"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CriticalDialogPage() {
  const router = useRouter();
  const mockError = new Error(
    "Module [project]/apps/app/node_modules/next/dist/lib/framework/example.js failed to load"
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Erro Critico</h1>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro grave na aplicacao.
        </p>

        <pre className="mb-4 p-3 bg-muted rounded-md text-xs text-left max-h-32 text-muted-foreground whitespace-pre-wrap break-all">
          {mockError.message}
        </pre>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/sandbox/dialogs">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Sandbox
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
