import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface CascadeDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cascade?: {
    message: string;
    itemsThatWillBeDeleted: string[];
  };
}

const CascadeDeleteDialog: React.FC<CascadeDeleteDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  cascade,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {cascade && (
          <div className="my-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              {cascade.message}
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              {cascade.itemsThatWillBeDeleted.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="border-2">Cancelar</Button>
          </AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70">
            Deletar tudo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CascadeDeleteDialog;
