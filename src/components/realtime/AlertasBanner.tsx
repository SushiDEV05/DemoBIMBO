'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { Database } from '@/lib/types/database.types';

type AlertaRow = Database['public']['Tables']['alertas']['Row'];

interface AlertasBannerProps {
  alerta: AlertaRow | null;
  onDismiss: () => void;
}

export default function AlertasBanner({ alerta, onDismiss }: AlertasBannerProps) {
  if (!alerta || alerta.estado !== 'ACTIVA') return null;

  const isCritica = alerta.severidad === 'CRITICA';

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-50 px-3 py-2.5 transition-all animate-bounce ${
        isCritica
          ? 'bg-red-700 text-white shadow-2xl shadow-red-900/60'
          : 'bg-amber-600 text-slate-950 shadow-xl'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
            {isCritica ? (
              <ShieldAlert className="h-6 w-6 text-white" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-slate-950" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-black uppercase tracking-wider">
                [{alerta.severidad}]
              </span>
              <strong className="text-sm font-black tracking-tight">
                {alerta.mensaje}
              </strong>
            </div>
            <p className="text-xs opacity-90">
              Registrado: <strong>{alerta.valor_registrado}</strong> (Esperado: {alerta.valor_esperado})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/alertas"
            className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow hover:bg-slate-100"
          >
            <span>Atender</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl p-1.5 hover:bg-black/20"
            title="Cerrar aviso"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
