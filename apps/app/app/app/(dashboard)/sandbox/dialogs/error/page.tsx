"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ErrorDialogPage() {
  const router = useRouter();
  const mockError = new Error(
    "Failed to fetch data: Network request failed"
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Tente novamente ou volte para a pagina
            anterior.
          </p>
          <pre className="mt-4 p-3 bg-muted rounded text-xs text-left max-h-32 whitespace-pre-wrap break-all">
            {mockError.message}
          </pre>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={() => router.refresh()} className="w-full">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardFooter>

        <div className="px-6 pb-6 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link href="/app/sandbox/dialogs">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Sandbox
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
