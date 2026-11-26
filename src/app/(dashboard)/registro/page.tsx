import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Compass,
  Thermometer,
  FastForward,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RoleBadge from '@/components/layout/RoleBadge';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type LineaRow = Database['public']['Tables']['lineas']['Row'];

export default async function RegistroHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, lineas(nombre, codigo)')
    .eq('id', user?.id || '')
    .single();

  const profile = profileData as (ProfileRow & { lineas: LineaRow | null }) | null;
  const rol = profile?.rol || 'ENCARGADO';

  const modulos = [
    {
      title: '1. Batidora (Lote & Batida)',
      desc: 'Iniciar nuevo lote, registrar tiempo de batido con cronómetro y descontar receta.',
      href: '/registro/batidora',
      icon: Clock,
      color: 'bg-blue-600 shadow-blue-600/20',
      badge: 'Etapa 1',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: '2. Divisora de Masa',
      desc: 'Medición de ángulo de corte (grados) de la divisora por turno.',
      href: '/registro/divisora',
      icon: Compass,
      color: 'bg-emerald-600 shadow-emerald-600/20',
      badge: 'Etapa 2',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: '3. Temperaturas de Proceso',
      desc: 'Monitoreo de Celdas de fermentación, Cámara de vapor y Horno industrial.',
      href: '/registro/temperatura',
      icon: Thermometer,
      color: 'bg-amber-600 shadow-amber-600/20',
      badge: 'Etapas 3, 4 y 6',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: '4. Avance de Lote por Etapas',
      desc: 'Mover lotes en curso a la etapa consecutiva siguiente (Secuencia 1 a 8).',
      href: '/registro/avance-lote',
      icon: FastForward,
      color: 'bg-purple-600 shadow-purple-600/20',
      badge: 'Trazabilidad',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: '5. Registro de Merma',
      desc: 'Control de desperdicio en área de empaque (solo en etapa 8 - Calidad).',
      href: '/registro/merma',
      icon: Trash2,
      color: 'bg-red-600 shadow-red-600/20',
      badge: 'Etapa 8 Final',
      badgeStyle: 'bg-red-50 text-red-700 border-red-200',
    },
  ];

  return (
    <div className="space-y-6 text-gray-900">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RoleBadge rol={rol} size="sm" />
            <span className="text-xs font-semibold text-gray-600">
              Línea: {profile?.lineas?.nombre || 'General'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black !text-gray-900 sm:text-3xl">
            Captura de Datos Críticos
          </h1>
          <p className="text-sm text-gray-600">
            Formularios táctiles de entrada manual optimizados para pantalla móvil y guantes.
          </p>
        </div>
      </div>

      {/* Grid de Formularios Táctiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modulos.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-bimbo-red/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${m.color} text-white shadow-md`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${m.badgeStyle}`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold !text-gray-900 transition-colors group-hover:text-bimbo-red">
                    {m.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {m.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-bimbo-red" />
            </Link>
          );
        })}
      </div>

      {/* Nota Operativa */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-gray-700 shadow-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <strong className="font-bold text-gray-900">Garantía de Calidad Bimbo: </strong>
          Todas las mediciones ingresadas son validadas en tiempo real contra los umbrales configurados por Gerencia. Cualquier parámetro fuera de tolerancia generará inmediatamente una alerta visual en el sistema.
        </div>
      </div>
    </div>
  );
}