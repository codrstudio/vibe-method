'use client';

/**
 * WhatsApp Assign Dialog
 *
 * Dialog para atribuir um numero WhatsApp a uma operacao.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link as LinkIcon } from 'lucide-react';

interface Operation {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nature: 'system' | 'user';
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  operations: Operation[];
  users?: User[];
  onAssign: (data: {
    operationId: string;
    userId?: string;
    priority: number;
    notificationEmail?: string;
    notificationPhone?: string;
  }) => Promise<void>;
}

export function AssignDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  operations,
  users = [],
  onAssign,
}: AssignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [priority, setPriority] = useState(0);

  const selectedOperationData = operations.find((o) => o.id === selectedOperation);
  const isUserOperation = selectedOperationData?.nature === 'user';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOperation) return;
    if (isUserOperation && !selectedUser) return;

    setIsLoading(true);

    try {
      await onAssign({
        operationId: selectedOperation,
        userId: isUserOperation ? selectedUser : undefined,
        priority,
      });

      // Reset form
      setSelectedOperation('');
      setSelectedUser('');
      setPriority(0);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Atribuir Numero
          </DialogTitle>
          <DialogDescription>
            Vincular <strong>{channelName}</strong> a uma operacao
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation Select */}
          <div className="space-y-2">
            <Label htmlFor="operation">Operacao</Label>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger id="operation">
                <SelectValue placeholder="Selecione uma operacao" />
              </SelectTrigger>
              <SelectContent>
                {operations.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    <div className="flex flex-col">
                      <span>{op.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {op.nature === 'system' ? 'Sistema' : 'Por usuario'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Select (for user operations) */}
          {isUserOperation && (
            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Selecione um usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Maior prioridade = usado primeiro no fallback
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedOperation || (isUserOperation && !selectedUser)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
