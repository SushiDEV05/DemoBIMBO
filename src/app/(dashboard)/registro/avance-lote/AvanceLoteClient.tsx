'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { avanzarLoteSchema, AvanzarLoteFormData } from '@/lib/schemas/registros.schema';
import { avanzarLoteAction } from '@/lib/actions/lotes.actions';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FastForward,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface AvanceLoteClientProps {
  lotes: any[];
  todasLasEtapas: any[];
  userLineaId?: string | null;
}

export default function AvanceLoteClient({
  lotes,
  todasLasEtapas,
  userLineaId,
}: AvanceLoteClientProps) {
  const [selectedLoteId, setSelectedLoteId] = useState<string>(
    lotes[0]?.id || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedLote = lotes.find((l) => l.id === selectedLoteId);

  // Calcular la etapa siguiente estricta (orden + 1) en la misma línea
  let etapaSiguiente: any = null;
  if (selectedLote) {
    const ordenActual = selectedLote.etapas_linea.orden;
    const lineaId = selectedLote.etapas_linea.linea_id;
    etapaSiguiente = todasLasEtapas.find(
      (e) => e.linea_id === lineaId && e.orden === ordenActual + 1
    );
  }

  const {
    register,
    handleSubmit,
    setValue,
  } = useForm<AvanzarLoteFormData>({
    resolver: zodResolver(avanzarLoteSchema),
    defaultValues: {
      lote_id: lotes[0]?.id || '',
      etapa_destino_id: etapaSiguiente?.id || '',
      observaciones: '',
    },
  });

  const handleLoteSelect = (loteId: string) => {
    setSelectedLoteId(loteId);
    setValue('lote_id', loteId);

    const lote = lotes.find((l) => l.id === loteId);
    if (lote) {
      const ordenActual = lote.etapas_linea.orden;
      const lineaId = lote.etapas_linea.linea_id;
      const sig = todasLasEtapas.find(
        (e) => e.linea_id === lineaId && e.orden === ordenActual + 1
      );
      if (sig) {
        setValue('etapa_destino_id', sig.id);
      }
    }
  };

  const onSubmit = async (data: AvanzarLoteFormData) => {
    if (!etapaSiguiente) return;
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await avanzarLoteAction({
        ...data,
        etapa_destino_id: etapaSiguiente.id,
      });

      if (!res.success) {
        setServerError(res.error || 'Error al avanzar etapa');
      } else {
        setSuccessMessage(
          `Lote ${selectedLote?.codigo_lote} avanzado exitosamente a la Etapa ${etapaSiguiente.orden}: ${etapaSiguiente.nombre}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24 text-gray-900">
      {/* Retorno */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <Link
          href="/registro"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al menú de registros</span>
        </Link>
        <span className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
          Trazabilidad Secuencial (1 a 8)
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black !text-gray-900 sm:text-3xl">
          Avance de Lote por Etapas
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Mueve el lote a la etapa inmediata consecutiva en la línea de producción, registrando automáticamente la fecha/hora y usuario.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
          <div className="text-sm font-semibold">{serverError}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-sm font-bold">{successMessage}</span>
          </div>
          <Link
            href="/flujo"
            className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
          >
            Ver tablero general de flujo
          </Link>
        </div>
      )}

      {lotes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Layers className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-3 text-lg font-bold !text-gray-900">
            No hay lotes activos en proceso
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Cree un nuevo lote registrando una batida en la Etapa 1 (Batidora).
          </p>
          <Link
            href="/registro/batidora"
            className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-bimbo-red px-5 text-sm font-bold text-white shadow-md shadow-bimbo-red/25 transition-all hover:bg-bimbo-redHover"
          >
            Registrar Primera Batida
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Selector de Lote Activo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="block text-sm font-bold uppercase text-gray-900">
              1. Seleccione el Lote a Transferir
            </label>
            <div className="mt-3 space-y-2.5">
              {lotes.map((l) => {
                const isSelected = selectedLoteId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleLoteSelect(l.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${isSelected
                      ? 'border-bimbo-red bg-red-50/40 ring-1 ring-bimbo-red/30 shadow-sm'
                      : 'border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-white'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-base font-black text-gray-900">
                          {l.codigo_lote}
                        </strong>
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {l.ordenes_produccion.lineas.codigo}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-gray-600">
                        {l.ordenes_produccion.productos.nombre} • Orden:{' '}
                        <span className="font-semibold text-gray-800">
                          {l.ordenes_produccion.codigo_orden}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        Etapa {l.etapas_linea.orden}: {l.etapas_linea.nombre}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visualización de Transición de Etapa */}
          {selectedLote && (
            <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
              <span className="mb-3 block text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                Transición de Etapa Solicitada
              </span>

              <div className="flex items-center justify-center gap-3 sm:gap-6">
                {/* Etapa Origen */}
                <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500">
                    Etapa Actual ({selectedLote.etapas_linea.orden})
                  </span>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {selectedLote.etapas_linea.nombre}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-md shadow-purple-600/25">
                  <ArrowRight className="h-5 w-5" />
                </div>

                {/* Etapa Destino */}
                <div className="flex-1 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-center">
                  <span className="text-[10px] font-bold uppercase text-purple-700">
                    Etapa Destino ({etapaSiguiente?.orden || 'Fin'})
                  </span>
                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {etapaSiguiente ? etapaSiguiente.nombre : 'Proceso Finalizado'}
                  </p>
                </div>
              </div>

              {etapaSiguiente?.orden === 8 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-medium text-amber-800">
                  ℹ️ Al transferir a la Etapa 8 (Empaquetado y Calidad), el lote completará su ciclo productivo y estará disponible para el pesaje final de merma.
                </div>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="block text-sm font-bold text-gray-900">
              Observaciones del Movimiento (Opcional)
            </label>
            <input
              type="text"
              {...register('observaciones')}
              placeholder="Ej: Aprobado visualmente, banda despejada..."
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            />
          </div>

          {/* Botón de Confirmación */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !etapaSiguiente}
              className="flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-purple-600 px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registrando avance de etapa...</span>
              ) : etapaSiguiente ? (
                <div className="flex items-center gap-2">
                  <FastForward className="h-6 w-6" />
                  <span>
                    Confirmar Avance a Etapa {etapaSiguiente.orden}: {etapaSiguiente.nombre}
                  </span>
                </div>
              ) : (
                <span>El lote ya está en la etapa final</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}