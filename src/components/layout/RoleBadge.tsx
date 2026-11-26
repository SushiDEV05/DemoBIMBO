import React from 'react';
import { RolUsuario } from '@/lib/types/database.types';

interface RoleBadgeProps {
  rol: RolUsuario;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoleBadge({ rol, size = 'md' }: RoleBadgeProps) {
  const styles = {
    ENCARGADO: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
    SUPERVISOR: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    GERENCIA: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
  };

  const labels = {
    ENCARGADO: 'ENCARGADO DE LÍNEA',
    SUPERVISOR: 'SUPERVISOR DE TURNO',
    GERENCIA: 'GERENCIA DE OPERACIONES',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-black tracking-wider uppercase rounded-full border shadow-sm ${styles[rol]} ${sizes[size]}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {labels[rol]}
    </span>
  );
}
