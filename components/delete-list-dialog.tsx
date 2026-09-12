'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface DeleteListDialogProps {
  listId: string;
  listName: string;
}

export function DeleteListDialog({ listId, listName }: DeleteListDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canDelete = confirmText === listName;

  async function handleDelete() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('lists').delete().eq('id', listId);
    if (deleteError) {
      setError('No se pudo eliminar la lista.');
      setDeleting(false);
      return;
    }
    router.push('/');
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Eliminar lista
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setConfirmText('');
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle>¿Eliminar &ldquo;{listName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se van a borrar todos sus items e invitaciones. Escribí{' '}
              <strong className="text-foreground">{listName}</strong> para confirmar.
            </AlertDialogDescription>
          </div>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={listName}
            autoFocus
          />
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={!canDelete || deleting} onClick={handleDelete}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
