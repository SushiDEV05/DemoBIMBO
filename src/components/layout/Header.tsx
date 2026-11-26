'use client';

import React from 'react';
import Link from 'next/link';
import { logoutAction } from '@/lib/actions/auth.actions';
import RoleBadge from './RoleBadge';
import { Database } from '@/lib/types/database.types';
import { Bell, Clock, Factory, LogOut, Wifi } from 'lucide-react';
import { calcularTurnoActualLima } from '@/lib/utils/turnos';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Linea = Database['public']['Tables']['lineas']['Row'];

interface HeaderProps {
  profile: Profile;
  linea?: Linea | null;
  alertasActivasCount?: number;
}

export default function Header({
  profile,
  linea,
  alertasActivasCount = 0,
}: HeaderProps) {
  const infoTurno = calcularTurnoActualLima();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Logotipo y Título */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/icons/logo-bimbo.png"
              alt="Logo Grupo Bimbo"
              className="h-10 w-auto object-contain"
            />
            <div className="border-l border-gray-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-gray-900 sm:text-lg">
                  CONTROL CRÍTICO
                </span>
                <span className="hidden rounded bg-bimbo-blue px-1.5 py-0.5 text-[10px] font-bold text-white sm:inline-block">
                  PLANTA
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Factory className="h-3.5 w-3.5 text-bimbo-red" />
                {linea ? (
                  <strong className="font-semibold text-gray-800">{linea.nombre}</strong>
                ) : profile.rol === 'GERENCIA' ? (
                  <span className="font-medium">Visión Global Planta</span>
                ) : (
                  <span className="font-medium">Todas las Líneas</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Información Operativa de Turno y Usuario */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicador Turno Lima */}
          <div className="hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 md:flex md:items-center md:gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase text-gray-900">
                {infoTurno.nombreTurno}
              </p>
              <p className="text-[10px] font-medium text-gray-500">
                Jornada: {infoTurno.fechaTurno} • {infoTurno.horaActualLima}
              </p>
            </div>
          </div>

          {/* Badge de Rol */}
          <div className="hidden sm:block">
            <RoleBadge rol={profile.rol} size="sm" />
          </div>

          {/* Botón de Alertas con Badge Contador */}
          <Link
            href="/alertas"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
            title="Ver Alertas de Planta"
          >
            <Bell className="h-5 w-5" />
            {alertasActivasCount > 0 && (
              <span className="alert-pulse absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                {alertasActivasCount > 9 ? '9+' : alertasActivasCount}
              </span>
            )}
          </Link>

          {/* Botón Cerrar Sesión */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Cerrar Turno / Salir"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Sub-barra móvil con info de Turno */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-1.5 text-[11px] sm:hidden">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span>{infoTurno.nombreTurno}</span>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge rol={profile.rol} size="sm" />
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <Wifi className="h-3 w-3" />
            <span>En Línea</span>
          </div>
        </div>
      </div>
    </header>
  );
}