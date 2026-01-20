"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const dialogTypes = [
  {
    name: "Critical",
    href: "/app/sandbox/dialogs/critical",
    description:
      "Erro critico - usado quando a aplicacao falha completamente (global-error)",
    icon: AlertTriangle,
    variant: "destructive" as const,
  },
  {
    name: "Error",
    href: "/app/sandbox/dialogs/error",
    description:
      "Card de erro - usado em boundaries de erro de paginas e componentes",
    icon: AlertCircle,
    variant: "warning" as const,
  },
  {
    name: "Confirm",
    href: "/app/sandbox/dialogs/confirm",
    description:
      "Dialog de confirmacao - usado para acoes destrutivas ou importantes",
    icon: CheckCircle,
    variant: "default" as const,
  },
];

export default function DialogsSandboxPage() {
  return (
    <div className="container max-w-4xl py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dialogs Sandbox</h1>
        <p className="text-muted-foreground">
          Visualize e teste os diferentes tipos de dialogs e feedback do
          sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dialogTypes.map((dialog) => (
          <Card key={dialog.href} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${
                    dialog.variant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : dialog.variant === "warning"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  <dialog.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{dialog.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{dialog.description}</CardDescription>
              <Button asChild variant="outline" className="w-full group-hover:bg-muted">
                <Link href={dialog.href}>
                  Ver exemplo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
