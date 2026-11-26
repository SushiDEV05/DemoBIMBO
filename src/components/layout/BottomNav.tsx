'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RolUsuario } from '@/lib/types/database.types';
import {
  Bell,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  PenTool,
  Settings,
} from 'lucide-react';

interface BottomNavProps {
  rol: RolUsuario;
  alertasActivasCount?: number;
}

export default function BottomNav({ rol, alertasActivasCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Tablero',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname.startsWith('/flujo'),
    },
    {
      href: '/registro',
      label: 'Registrar',
      icon: PenTool,
      active: pathname.startsWith('/registro'),
    },
    {
      href: '/alertas',
      label: 'Alertas',
      icon: Bell,
      active: pathname.startsWith('/alertas'),
      badge: alertasActivasCount,
    },
    {
      href: rol === 'GERENCIA' ? '/reportes' : '/historial',
      label: rol === 'GERENCIA' ? 'Reportes' : 'Historial',
      icon: rol === 'GERENCIA' ? FileSpreadsheet : History,
      active: pathname.startsWith('/reportes') || pathname.startsWith('/historial'),
    },
  ];

  if (rol === 'GERENCIA') {
    navItems.push({
      href: '/admin',
      label: 'Admin',
      icon: Settings,
      active: pathname.startsWith('/admin'),
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5 sm:max-w-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[50px] min-w-[60px] flex-col items-center justify-center rounded-xl p-1 transition-all ${item.active
                ? 'bg-red-50 font-bold text-bimbo-red'
                : 'font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${item.active ? 'text-bimbo-red' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="alert-pulse absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}