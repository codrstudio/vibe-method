"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | null;

const INSTALL_DELAY = 30000; // 30 segundos
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (isStandalone) {
      localStorage.setItem("pwa-installed", "true");
      return;
    }

    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform("ios");
      const timer = setTimeout(() => setShowPrompt(true), INSTALL_DELAY);
      return () => clearTimeout(timer);
    }

    if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), INSTALL_DELAY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm animate-in slide-in-from-top">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              {platform === "ios" ? (
                <>
                  <p className="text-sm font-medium">Instale o app</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Toque em <Share className="h-3 w-3 inline" /> e depois em
                    &quot;Adicionar a Tela de Inicio&quot;
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Instale o app</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Acesso rapido direto da sua tela inicial
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {platform !== "ios" && deferredPrompt && (
              <Button size="sm" onClick={handleInstall}>
                Instalar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
