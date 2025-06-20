
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Simple hash function for frontend (not cryptographically secure, just for demo)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const PasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const ADMIN_EMAIL = 'kartem2001@yahoo.com';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Новые пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Verifying current password for:', ADMIN_EMAIL);
      const verifyRes = await supabase.functions.invoke('verify-admin', {
        body: { email: ADMIN_EMAIL, password: currentPassword },
      });

      console.log('Verify response:', verifyRes);

      if (verifyRes.error || !verifyRes.data?.success) {
        throw new Error('Неверный текущий пароль');
      }

      // For this demo, we'll use a simple hash since bcrypt doesn't work in browser
      const hashed = await simpleHash(newPassword);
      console.log('Updating password hash for:', ADMIN_EMAIL);

      const updateRes = await supabase.functions.invoke('update-admin-password', {
        body: { email: ADMIN_EMAIL, passwordHash: hashed },
      });

      console.log('Update response:', updateRes);

      if (updateRes.error || !updateRes.data?.success) {
        throw new Error('Не удалось обновить пароль');
      }

      toast({
        title: 'Успешно',
        description: 'Пароль успешно изменен',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: 'Ошибка',
        description: (error as Error).message || 'Не удалось изменить пароль',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Смена пароля
        </CardTitle>
        <CardDescription>
          Измените пароль для доступа к административной панели (Email: {ADMIN_EMAIL})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Изменение пароля...
              </>
            ) : (
              'Изменить пароль'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
