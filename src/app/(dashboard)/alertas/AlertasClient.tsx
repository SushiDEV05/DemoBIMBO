'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Database } from '@/lib/types/database.types';
import { useAlertasRealtime } from '@/lib/hooks/useAlertasRealtime';
import { reconocerAlertaAction, cerrarAlertaAction } from '@/lib/actions/alertas.actions';
import { useRouter } from 'next/navigation';
import AlertasBanner from '@/components/realtime/AlertasBanner';

type LineaRow = Database['public']['Tables']['lineas']['Row'];

interface AlertasClientProps {
  initialAlertas: any[];
  lineas: LineaRow[];
  userProfile: any;
}

export default function AlertasClient({
  initialAlertas,
  lineas,
  userProfile,
}: AlertasClientProps) {
  const router = useRouter();
  const {
    alertas,
    activasCount,
    criticasCount,
    nuevaAlertaCritica,
    dismissBanner,
  } = useAlertasRealtime(initialAlertas, userProfile?.linea_id);

  // Estados de Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('TODAS');
  const [filtroLinea, setFiltroLinea] = useState<string>('TODAS');

  // Estado Modal Reconocimiento
  const [alertaParaReconocer, setAlertaParaReconocer] = useState<any | null>(null);
  const [comentario, setComentario] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const rol = userProfile?.rol || 'ENCARGADO';
  const puedeGestionarAlertas = rol === 'SUPERVISOR' || rol === 'GERENCIA';

  // Aplicar filtros
  const alertasFiltradas = alertas.filter((a) => {
    if (filtroEstado !== 'TODAS' && a.estado !== filtroEstado) return false;
    if (filtroSeveridad !== 'TODAS' && a.severidad !== filtroSeveridad) return false;
    if (filtroLinea !== 'TODAS' && a.linea_id !== filtroLinea) return false;
    return true;
  });

  const handleOpenReconocer = (alerta: any) => {
    setAlertaParaReconocer(alerta);
    setComentario('');
    setModalError(null);
  };

  const handleConfirmReconocer = async () => {
    if (!alertaParaReconocer) return;
    if (comentario.trim().length < 5) {
      setModalError('Debe ingresar un comentario de al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await reconocerAlertaAction(alertaParaReconocer.id, comentario);
      if (!res.success) {
        setModalError(res.error || 'Error al reconocer alerta');
      } else {
        setAlertaParaReconocer(null);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCerrarAlerta = async (alertaId: string) => {
    if (!confirm('¿Confirma el cierre formal de esta alerta? (Indica que el parámetro ha vuelto a la normalidad).')) {
      return;
    }

    try {
      const res = await cerrarAlertaAction(alertaId);
      if (!res.success) {
        alert(res.error || 'Error al cerrar alerta');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* Banner flotante de alerta crítica en tiempo real */}
      <AlertasBanner alerta={nuevaAlertaCritica} onDismiss={dismissBanner} />

      {/* Encabezado */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
              Monitoreo en Tiempo Real
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Supabase Realtime WebSockets
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black !text-gray-900 sm:text-3xl">
            Bandeja de Alertas Críticas
          </h1>
          <p className="text-xs text-gray-600">
            Detección automática de desviaciones térmicas, angulares, tiempos de batido y límites de merma.
          </p>
        </div>

        {/* Contadores */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs shadow-sm">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <span className="block text-[10px] font-bold uppercase text-red-700">Críticas</span>
              <strong className="font-mono text-base font-black text-red-700">{criticasCount}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs shadow-sm">
            <Clock className="h-4 w-4 text-amber-600" />
            <div>
              <span className="block text-[10px] font-bold uppercase text-amber-700">Activas</span>
              <strong className="font-mono text-base font-black text-amber-700">{activasCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600">
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filtros de Búsqueda</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Filtro Estado */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Estado de Alerta
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="TODAS">Todos los Estados</option>
              <option value="ACTIVA">🔴 Activas (Pendientes)</option>
              <option value="RECONOCIDA">🟡 Reconocidas (En Atención)</option>
              <option value="CERRADA">🟢 Cerradas (Resueltas)</option>
            </select>
          </div>

          {/* Filtro Severidad */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Severidad
            </label>
            <select
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="TODAS">Todas las Severidades</option>
              <option value="CRITICA">CRÍTICA (Desvío mayor)</option>
              <option value="ADVERTENCIA">ADVERTENCIA (Desvío leve)</option>
            </select>
          </div>

          {/* Filtro Línea */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Línea de Producción
            </label>
            <select
              value={filtroLinea}
              onChange={(e) => setFiltroLinea(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="TODAS">Todas las Líneas</option>
              {lineas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre} ({l.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Tarjetas de Alerta */}
      <div className="space-y-3">
        {alertasFiltradas.map((alerta) => {
          const isCritica = alerta.severidad === 'CRITICA';
          const isActiva = alerta.estado === 'ACTIVA';
          const isReconocida = alerta.estado === 'RECONOCIDA';
          const isCerrada = alerta.estado === 'CERRADA';
          const lineaInfo = lineas.find((l) => l.id === alerta.linea_id);

          return (
            <div
              key={alerta.id}
              className={`rounded-2xl border p-4 shadow-sm transition-all sm:p-5 ${isCritica && isActiva
                  ? 'border-red-300 bg-red-50/60 ring-1 ring-red-200'
                  : isActiva
                    ? 'border-amber-300 bg-amber-50/50'
                    : isReconocida
                      ? 'border-blue-200 bg-white'
                      : 'border-gray-200 bg-gray-50/80 opacity-85'
                }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Detalle Principal */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${isCritica
                          ? 'animate-pulse bg-red-600 text-white'
                          : 'bg-amber-500 text-white'
                        }`}
                    >
                      {alerta.severidad}
                    </span>

                    <span
                      className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold uppercase ${isActiva
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : isReconocida
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                    >
                      Estado: {alerta.estado}
                    </span>

                    <span className="rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      Línea: {lineaInfo?.nombre || (alerta as any).lineas?.nombre || alerta.linea_id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold !text-gray-900 sm:text-lg">
                    {alerta.mensaje}
                  </h3>

                  {/* Comparación Visual de Valores */}
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs">
                    <div>
                      <span className="text-gray-500">Valor Medido: </span>
                      <strong className="text-sm font-black text-red-600">
                        {alerta.valor_registrado}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Esperado / Rango: </span>
                      <strong className="text-sm font-black text-emerald-600">
                        {alerta.valor_esperado}
                      </strong>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Tipo: <span className="font-semibold text-gray-800">{alerta.tipo}</span>
                    </div>
                  </div>

                  {/* Detalle de Reconocimiento si aplica */}
                  {isReconocida && alerta.comentario_reconocimiento && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Acción Correctiva / Reconocimiento:</span>
                      </div>
                      <p className="mt-1 font-medium">{alerta.comentario_reconocimiento}</p>
                      <p className="mt-1 text-[10px] text-blue-600">
                        Reconocida el{' '}
                        {alerta.reconocida_at
                          ? new Date(alerta.reconocida_at).toLocaleString('es-PE')
                          : ''}
                      </p>
                    </div>
                  )}

                  {isCerrada && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Cerrada formalmente el{' '}
                      {alerta.cerrada_at ? new Date(alerta.cerrada_at).toLocaleString('es-PE') : ''}
                    </p>
                  )}
                </div>

                {/* Acciones para Supervisor y Gerencia */}
                <div className="flex shrink-0 gap-2 pt-2 sm:flex-col sm:pt-0">
                  {puedeGestionarAlertas && isActiva && (
                    <button
                      type="button"
                      onClick={() => handleOpenReconocer(alerta)}
                      className="flex min-h-[40px] items-center justify-center rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      <span>Reconocer Alerta</span>
                    </button>
                  )}

                  {puedeGestionarAlertas && isReconocida && (
                    <button
                      type="button"
                      onClick={() => handleCerrarAlerta(alerta.id)}
                      className="flex min-h-[40px] items-center justify-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      <span>Cerrar Alerta</span>
                    </button>
                  )}

                  <span className="self-end text-right text-[11px] font-medium text-gray-500 sm:self-auto">
                    {new Date(alerta.created_at).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {alertasFiltradas.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mt-3 text-lg font-bold !text-gray-900">
              Sin Alertas en el Criterio Seleccionado
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Todos los parámetros de planta se encuentran dentro de las tolerancias establecidas.
            </p>
          </div>
        )}
      </div>

      {/* Modal Táctil de Reconocimiento Obligatorio */}
      {alertaParaReconocer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Reconocimiento de Alerta de Planta</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertaParaReconocer(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
                <p className="font-bold text-gray-900">{alertaParaReconocer.mensaje}</p>
                <p className="mt-1 text-gray-600">
                  Registrado:{' '}
                  <strong className="text-red-600">{alertaParaReconocer.valor_registrado}</strong>{' '}
                  (Esperado: {alertaParaReconocer.valor_esperado})
                </p>
              </div>

              {modalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  {modalError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                  Comentario Obligatorio de Atención / Acción Correctiva *
                </label>
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej: Se constató desvío en piso; se ajustó temperatura de quemadores en zona 2 del horno."
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Mínimo 5 caracteres. Este comentario quedará registrado con su usuario para auditoría.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setAlertaParaReconocer(null)}
                className="min-h-[42px] rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReconocer}
                className="min-h-[42px] rounded-xl bg-amber-600 px-5 text-sm font-bold text-white shadow-md shadow-amber-600/25 transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar Reconocimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}