'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FastForward,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Database } from '@/lib/types/database.types';
import { avanzarLoteAction } from '@/lib/actions/lotes.actions';

type LineaRow = Database['public']['Tables']['lineas']['Row'];

interface FlujoLineaClientProps {
  lineas: LineaRow[];
  activeLinea: LineaRow;
  etapas: any[];
  lotes: any[];
  alertas: any[];
  userProfile: any;
}

export default function FlujoLineaClient({
  lineas,
  activeLinea,
  etapas,
  lotes,
  alertas,
  userProfile,
}: FlujoLineaClientProps) {
  const router = useRouter();
  const [movingLoteId, setMovingLoteId] = useState<string | null>(null);

  const handleQuickAvance = async (loteId: string, etapaActualOrden: number) => {
    const etapaSiguiente = etapas.find((e) => e.orden === etapaActualOrden + 1);
    if (!etapaSiguiente) return;

    setMovingLoteId(loteId);
    try {
      await avanzarLoteAction({
        lote_id: loteId,
        etapa_destino_id: etapaSiguiente.id,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setMovingLoteId(null);
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* Selector de Línea y Acciones Superiores */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-bimbo-blue px-2.5 py-1 text-xs font-black text-white">
              {activeLinea.codigo}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              8 Etapas Secuenciales Configurables
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black !text-gray-900 sm:text-3xl">
            Tablero de Flujo: {activeLinea.nombre}
          </h1>
          <p className="text-xs text-gray-600">
            Monitoreo en vivo de los lotes en producción a lo largo de las 8 etapas del proceso Bimbo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/registro/batidora"
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-bimbo-red px-4 text-sm font-bold text-white shadow-md shadow-bimbo-red/25 transition-all hover:bg-bimbo-redHover"
          >
            <Plus className="mr-1.5 h-5 w-5" />
            <span>Iniciar Nueva Batida</span>
          </Link>
        </div>
      </div>

      {/* Pestañas de Selección de Línea (PAN, BOLLERIA, PANQUELERIA) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {lineas.map((l) => {
          const isActive = l.id === activeLinea.id;
          return (
            <Link
              key={l.id}
              href={`/flujo?linea=${l.codigo}`}
              className={`flex min-h-[46px] items-center gap-2 whitespace-nowrap rounded-xl border px-5 text-sm font-bold transition-all ${isActive
                  ? 'border-bimbo-blue bg-bimbo-blue text-white shadow-md shadow-bimbo-blue/25'
                  : 'border-gray-200 bg-white text-gray-600 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span>{l.nombre}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-white text-bimbo-blue' : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {l.codigo}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Tablero Kanban Horizontal de las 8 Etapas */}
      <div className="overflow-x-auto pb-6">
        <div className="flex min-w-[1400px] gap-4">
          {etapas.map((etapa) => {
            const lotesEnEtapa = lotes.filter((l) => l.etapa_actual_id === etapa.id);
            const equipo = etapa.equipos?.[0];
            const alertaEtapa = alertas.find((a) => a.equipo_id === equipo?.id);

            let semaforoColor = 'bg-emerald-500';
            let semaforoText = 'Operativo';
            let borderStyle = 'border-gray-200 shadow-sm';

            if (alertaEtapa) {
              semaforoColor =
                alertaEtapa.severidad === 'CRITICA'
                  ? 'bg-red-500 animate-ping'
                  : 'bg-amber-500 animate-pulse';
              semaforoText = alertaEtapa.severidad;
              borderStyle = 'border-red-300 ring-1 ring-red-200 shadow-md shadow-red-100';
            } else if (lotesEnEtapa.length >= 3) {
              semaforoColor = 'bg-amber-400';
              semaforoText = 'Acumulación';
            }

            return (
              <div
                key={etapa.id}
                className={`flex min-w-[200px] max-w-[240px] flex-1 flex-col justify-between rounded-2xl border bg-white p-3 transition-all ${borderStyle}`}
              >
                {/* Cabecera de Etapa */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-bimbo-red text-xs font-black text-white">
                        {etapa.orden}
                      </span>
                      <span
                        className="max-w-[115px] truncate text-xs font-bold text-gray-900"
                        title={etapa.nombre}
                      >
                        {etapa.nombre}
                      </span>
                    </div>

                    {/* Semáforo */}
                    <div className="flex items-center gap-1" title={`Estado: ${semaforoText}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${semaforoColor}`} />
                    </div>
                  </div>

                  {/* Info de Parámetro y Equipo */}
                  <div className="mt-2 text-[11px] leading-tight">
                    <p className="truncate font-semibold text-gray-800">
                      {equipo?.nombre || 'Equipo de proceso'}
                    </p>
                    <p className="mt-0.5 font-medium text-amber-700">
                      {equipo?.tipo_parametro === 'TIEMPO' && 'Tiempo de batido'}
                      {equipo?.tipo_parametro === 'ANGULO' &&
                        `Ángulo [${equipo.angulo_min}° - ${equipo.angulo_max}°]`}
                      {equipo?.tipo_parametro === 'TEMPERATURA' &&
                        `Temp [${equipo.temp_min}°C - ${equipo.temp_max}°C]`}
                      {equipo?.tipo_parametro === 'NINGUNO' &&
                        (etapa.orden === 8 ? 'Control Merma' : 'Paso en continuo')}
                    </p>
                  </div>

                  {/* Contador de Lotes */}
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-gray-600">Lotes en etapa:</span>
                    <strong className="font-mono font-bold text-gray-900">
                      {lotesEnEtapa.length}
                    </strong>
                  </div>

                  {/* Alerta si existe */}
                  {alertaEtapa && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-[10px] text-red-800">
                      <div className="flex items-center gap-1 font-bold text-red-700">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Alerta: {alertaEtapa.valor_registrado}</span>
                      </div>
                    </div>
                  )}

                  {/* Tarjetas de Lotes */}
                  <div className="mt-3 space-y-2.5">
                    {lotesEnEtapa.map((lote) => {
                      const isMoving = movingLoteId === lote.id;
                      const tiempoIngreso = new Date(lote.created_at);
                      const minTranscurridos = Math.max(
                        0,
                        Math.floor((Date.now() - tiempoIngreso.getTime()) / 60000)
                      );

                      return (
                        <div
                          key={lote.id}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm transition-all hover:border-gray-300 hover:bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <strong className="font-mono text-xs font-black text-gray-900">
                              {lote.codigo_lote}
                            </strong>
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500">
                              <Clock className="h-2.5 w-2.5" />
                              {minTranscurridos}m
                            </span>
                          </div>

                          <p className="mt-1 truncate text-[11px] font-bold text-gray-800">
                            {lote.ordenes_produccion.productos.nombre}
                          </p>

                          <p className="truncate text-[10px] font-medium text-gray-500">
                            OP: {lote.ordenes_produccion.codigo_orden}
                          </p>

                          {/* Botón de Avance Directo */}
                          {etapa.orden < 8 ? (
                            <button
                              type="button"
                              disabled={isMoving}
                              onClick={() => handleQuickAvance(lote.id, etapa.orden)}
                              className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-600 hover:text-white disabled:opacity-50"
                            >
                              {isMoving ? (
                                <span>Avanzando...</span>
                              ) : (
                                <>
                                  <FastForward className="h-3 w-3" />
                                  <span>Avanzar a Etapa {etapa.orden + 1}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <Link
                              href="/registro/merma"
                              className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-[11px] font-bold text-red-700 transition-colors hover:bg-bimbo-red hover:text-white"
                            >
                              <span>Registrar Merma / Fin</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      );
                    })}

                    {lotesEnEtapa.length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-6 text-center text-[11px] font-medium text-gray-400">
                        Banda despejada
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de Etapa */}
                <div className="mt-3 border-t border-gray-100 pt-2 text-center">
                  <span className="text-[9px] font-bold uppercase text-gray-400">
                    Etapa {etapa.orden} de 8
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}