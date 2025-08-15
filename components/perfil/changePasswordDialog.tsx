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
  onSavePassword: (password: string) => void; // <-- Adicionamos esta propriedade
}

export default function ChangePasswordDialog({ isOpen, onOpenChange, onSavePassword }: ChangePasswordDialogProps) {
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
    
    // ** CORREÇÃO AQUI **
    // Em vez de 'console.log', chamamos a função que recebemos por props
    onSavePassword(newPassword);
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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted/20 border border-primary/30 shadow-md">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Alterar Senha
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base leading-relaxed">
            Crie uma senha forte e única para manter sua conta segura
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="newPassword" className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Nova Senha
            </Label>
            <div className="relative">
              <Input 
                id="newPassword" 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 border border-blue-300/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all rounded-lg pr-12 text-base bg-gradient-to-r from-blue-50/40 to-cyan-50/40 hover:border-blue-400"
                placeholder="Digite sua nova senha"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-blue-100/70 rounded-lg" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-blue-600"/> : <Eye className="h-5 w-5 text-blue-600"/>}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Confirmar Nova Senha
            </Label>
            <Input 
              id="confirmPassword" 
              type={showPassword ? 'text' : 'password'} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 border border-purple-300/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all rounded-lg text-base bg-gradient-to-r from-purple-50/40 to-pink-50/40 hover:border-purple-400"
              placeholder="Confirme sua nova senha"
            />
          </div>
          
          {/* Indicadores visuais menores */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 shadow-sm">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Requisitos:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  newPassword.length >= 6 ? 'bg-green-500 shadow-sm' : 'bg-gray-300'
                }`}>
                  {newPassword.length >= 6 && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`font-medium transition-colors ${
                  newPassword.length >= 6 ? 'text-green-700' : 'text-gray-500'
                }`}>
                  Mínimo 6 caracteres
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  passwordsMatch && confirmPassword ? 'bg-green-500 shadow-sm' : 'bg-gray-300'
                }`}>
                  {passwordsMatch && confirmPassword && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`font-medium transition-colors ${
                  passwordsMatch && confirmPassword ? 'text-green-700' : 'text-gray-500'
                }`}>
                  Senhas coincidem
                </span>
              </div>
            </div>
          </div>
          
          {!passwordsMatch && confirmPassword && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-4 rounded-r-xl shadow-sm">
              <p className="text-red-700 font-medium text-sm">As senhas não coincidem</p>
            </div>
          )}
          
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-4 rounded-r-xl shadow-sm">
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-4 pt-4">
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="flex-1 h-11 border border-muted hover:border-primary hover:bg-primary/10 hover:text-primary rounded-lg font-medium transition-all text-base"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Salvar Nova Senha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}