// components/perfil/changePasswordDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ isOpen, onOpenChange }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = newPassword.length >= 6 && passwordsMatch;

  const handleSave = () => {
    if (!isFormValid) {
        setError('As senhas devem ter no mínimo 6 caracteres e ser iguais.');
        return;
    }
    console.log("Nova senha salva (simulação):", newPassword);
    onOpenChange(false);
    // Limpa os campos ao fechar
    setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Digite sua nova senha abaixo. Recomendamos uma senha forte e única.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2 relative">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button variant="ghost" size="icon" className="absolute bottom-1 right-1 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </Button>
            </div>
            {!passwordsMatch && confirmPassword && <p className="text-sm text-destructive">As senhas não são iguais.</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button type="submit" onClick={handleSave} disabled={!isFormValid}>Salvar Nova Senha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}