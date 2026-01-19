"use client";

import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold">Voce esta offline</h1>
      <p className="mt-2 text-muted-foreground text-center max-w-md">
        Verifique sua conexao com a internet e tente novamente.
      </p>
      <Button onClick={() => window.location.reload()} className="mt-6">
        Tentar novamente
      </Button>
    </div>
  );
}
