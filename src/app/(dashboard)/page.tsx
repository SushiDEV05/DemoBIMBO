import React from 'react';
import { createClient } from '@/lib/supabase/server';
import RoleBadge from '@/components/layout/RoleBadge';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Factory,
  Layers,
  PenTool,
} from 'lucide-react';
import { calcularTurnoActualLima } from '@/lib/utils/turnos';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type LineaRow = Database['public']['Tables']['lineas']['Row'];
type AlertaRow = Database['public']['Tables']['alertas']['Row'];

export default async function DashboardPage() {
  const supabase = createClient();
  const infoTurno = calcularTurnoActualLima();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, lineas(*)')
    .eq('id', user?.id || '')
    .single();

  const profile = profileData as (ProfileRow & { lineas: LineaRow | null }) | null;

  const { count: ordenesCount } = await supabase
    .from('ordenes_produccion')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'EN_PROCESO');

  const { data: alertasData } = await supabase
    .from('alertas')
    .select('*')
    .eq('estado', 'ACTIVA')
    .order('created_at', { ascending: false })
    .limit(3);

  const alertasActivas = (alertasData || []) as AlertaRow[];

  const { data: lineasData } = await supabase
    .from('lineas')
    .select('*')
    .order('codigo');

  const lineas = (lineasData || []) as LineaRow[];
  const rol = profile?.rol || 'ENCARGADO';

  return (
    <div className="space-y-6 text-gray-900">
      {/* Banner de Bienvenida y Estado Operativo */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge rol={rol} size="md" />
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Auth & RLS Activo
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black !text-gray-900 sm:text-3xl">
              ¡Bienvenido, {profile?.nombre_completo || 'Operador'}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {rol === 'ENCARGADO' ? (
                <>
                  Asignado a la <strong className="text-gray-900">{profile?.lineas?.nombre || 'Línea PAN'}</strong>. Registro de parámetros y trazabilidad de lotes.
                </>
              ) : rol === 'SUPERVISOR' ? (
                <>
                  Monitoreo de todas las líneas, validación de tolerancias y gestión de órdenes.
                </>
              ) : (
                <>
                  Control gerencial global de planta, tendencias térmicas, mermas y auditoría.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/registro"
              className="flex min-h-[48px] items-center justify-center rounded-xl bg-bimbo-red px-5 text-sm font-bold text-white shadow-md shadow-bimbo-red/25 transition-all hover:bg-bimbo-redHover"
            >
              <PenTool className="mr-2 h-5 w-5" />
              <span>Registrar Datos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de Resumen Rápido de Planta */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase">Línea Activa</span>
            <Factory className="h-4 w-4 text-bimbo-red" />
          </div>
          <p className="mt-2 truncate text-xl font-black text-gray-900">
            {profile?.lineas?.codigo || 'TODAS (3)'}
          </p>
          <p className="truncate text-[11px] font-medium text-gray-500">
            {profile?.lineas?.nombre || 'Planta Bimbo Completa'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase">Jornada</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 truncate text-xl font-black text-gray-900">
            {infoTurno.turno}
          </p>
          <p className="text-[11px] font-medium text-gray-500">
            Fecha: {infoTurno.fechaTurno}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase">Órdenes en Curso</span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-black text-gray-900">
            {ordenesCount || 0}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600">
            Planificadas en turno
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase">Alertas Activas</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-xl font-black text-red-600">
            {alertasActivas.length}
          </p>
          <p className="text-[11px] font-medium text-gray-500">
            Requieren atención
          </p>
        </div>
      </div>

      {/* Alertas Recientes */}
      {alertasActivas.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-700">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span>Alertas Críticas Recientes</span>
            </div>
            <Link
              href="/alertas"
              className="flex items-center gap-1 text-xs font-bold text-red-700 hover:underline"
            >
              <span>Ver todas</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {alertasActivas.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-start justify-between rounded-xl border border-red-200 bg-white p-3 text-xs shadow-sm"
              >
                <div>
                  <span className="font-bold uppercase tracking-wide text-red-600">
                    [{alerta.severidad}]
                  </span>{' '}
                  <span className="font-semibold text-gray-900">{alerta.mensaje}</span>
                  <p className="mt-0.5 text-gray-600">
                    Registrado: <strong className="text-amber-700">{alerta.valor_registrado}</strong> (Esperado: {alerta.valor_esperado})
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-[10px] font-medium text-gray-500">
                  {new Date(alerta.created_at).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Líneas de Producción de Planta Bimbo */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wider !text-gray-900">
            Líneas de Producción en Planta
          </h2>
          <span className="text-xs font-semibold text-gray-500">
            8 Etapas Secuenciales por Línea
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {lineas.map((l) => {
            const isAssigned = profile?.linea_id === l.id;
            return (
              <div
                key={l.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${isAssigned
                  ? 'border-bimbo-blue ring-1 ring-bimbo-blue/30'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-bimbo-blue px-2.5 py-1 text-xs font-black text-white">
                    {l.codigo}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Operativa
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold !text-gray-900">{l.nombre}</h3>
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Límite merma por turno:</span>
                    <strong className="text-amber-700">{l.limite_merma_turno_kg} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Etapas configuradas:</span>
                    <span className="font-semibold text-gray-800">8 etapas (1 a 8)</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                  <Link
                    href={`/flujo?linea=${l.codigo}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-bimbo-red hover:underline"
                  >
                    <span>Ver Flujo de Lotes</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}