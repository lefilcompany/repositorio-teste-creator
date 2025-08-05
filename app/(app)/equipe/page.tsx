'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Team } from '@/types/team';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';

export default function EquipePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (user?.teamId) {
      const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
      const t = teams.find((team) => team.id === user.teamId);
      if (t) {
        setTeam(t);
        if (user.email !== t.admin) {
          router.replace('/home');
        }
      }
    } else if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  const handleApprove = (email: string) => {
    if (!team) return;
    const teams = JSON.parse(localStorage.getItem('creator-teams') || '[]') as Team[];
    const index = teams.findIndex(t => t.id === team.id);
    if (index === -1) return;
    teams[index].pending = teams[index].pending.filter(e => e !== email);
    teams[index].members.push(email);
    localStorage.setItem('creator-teams', JSON.stringify(teams));
    setTeam(teams[index]);

    const users = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
    const uIndex = users.findIndex(u => u.email === email);
    if (uIndex > -1) {
      users[uIndex].status = 'active';
      localStorage.setItem('creator-users', JSON.stringify(users));
    }
  };

  if (!team) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Nenhuma equipe encontrada.</p>
      </div>
    );
  }

  if (user && user.email !== team.admin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">{team.name}</h1>
      {user?.role === 'admin' && (
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Solicitações pendentes</h2>
          {team.pending.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma solicitação.</p>
          ) : (
            <ul className="space-y-2">
              {team.pending.map(email => (
                <li key={email} className="flex justify-between items-center">
                  <span>{email}</span>
                  <Button size="sm" onClick={() => handleApprove(email)}>Aprovar</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Membros</h2>
        <ul className="space-y-1">
          {team.members.map(email => (
            <li key={email}>{email}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
