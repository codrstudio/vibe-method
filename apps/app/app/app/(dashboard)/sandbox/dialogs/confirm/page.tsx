"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ConfirmDialogPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success(`Acao "${action}" executada com sucesso!`);
  };

  return (
    <div className="container max-w-2xl py-8 px-4 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/sandbox/dialogs">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Confirm Dialog</h1>
          <p className="text-muted-foreground">
            Dialog de confirmacao para acoes destrutivas ou importantes
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Variante Destructive
            </CardTitle>
            <CardDescription>
              Usado para acoes de exclusao ou que nao podem ser desfeitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Acao Perigosa com Loading
            </CardTitle>
            <CardDescription>
              Demonstra o estado de loading durante a confirmacao
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setDangerOpen(true)}>
              <AlertTriangle className="h-4 w-4" />
              Resetar configuracoes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Variante Default
            </CardTitle>
            <CardDescription>
              Usado para confirmacoes gerais que nao sao destrutivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setConfirmOpen(true)}>
              <CheckCircle className="h-4 w-4" />
              Confirmar acao
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir item?"
        description="Esta acao nao pode ser desfeita. O item sera permanentemente removido."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => {
          setDeleteOpen(false);
          toast.success("Item excluido com sucesso!");
        }}
      />

      <ConfirmDialog
        open={dangerOpen}
        onOpenChange={setDangerOpen}
        title="Resetar configuracoes?"
        description="Todas as suas configuracoes personalizadas serao perdidas e restauradas para o padrao."
        confirmText="Resetar"
        cancelText="Cancelar"
        variant="destructive"
        loading={loading}
        onConfirm={() => handleAction("reset").then(() => setDangerOpen(false))}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar envio?"
        description="Os dados serao enviados para processamento."
        confirmText="Enviar"
        cancelText="Voltar"
        variant="default"
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success("Dados enviados com sucesso!");
        }}
      />
    </div>
  );
}
