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
import { useRouter } from "next/navigation";

interface ErrorCardProps {
  title?: string;
  message?: string;
  error?: Error;
  reset?: () => void;
  showDetails?: boolean;
}

export function ErrorCard({
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente ou volte para a pagina anterior.",
  error,
  reset,
  showDetails = process.env.NODE_ENV === "development",
}: ErrorCardProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{message}</p>
          {showDetails && error && (
            <pre className="mt-4 p-3 bg-muted rounded text-xs text-left max-h-32 whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {reset && (
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
