'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registroAnguloSchema, RegistroAnguloFormData } from '@/lib/schemas/registros.schema';
import { registrarAnguloAction } from '@/lib/actions/registros.actions';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  Save,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { Database } from '@/lib/types/database.types';

type EquipoRow = Database['public']['Tables']['equipos']['Row'];

interface DivisoraFormClientProps {
  equipos: (EquipoRow & { etapas_linea: { tipo: string; linea_id: string; nombre: string } })[];
  lotes: { id: string; codigo_lote: string }[];
  userLineaId?: string | null;
}

export default function DivisoraFormClient({
  equipos,
  lotes,
  userLineaId,
}: DivisoraFormClientProps) {
  const [selectedEquipoId, setSelectedEquipoId] = useState<string>(
    equipos[0]?.id || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedEquipo = equipos.find((e) => e.id === selectedEquipoId);

  const anguloMin = selectedEquipo?.angulo_min ?? 15;
  const anguloMax = selectedEquipo?.angulo_max ?? 45;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistroAnguloFormData>({
    resolver: zodResolver(registroAnguloSchema),
    defaultValues: {
      equipo_id: equipos[0]?.id || '',
      lote_id: lotes[0]?.id || null,
      angulo_grados: 30.0,
    },
  });

  const anguloActual = watch('angulo_grados') || 0;
  const enRango = anguloActual >= anguloMin && anguloActual <= anguloMax;

  const ajustarAngulo = (delta: number) => {
    const nuevo = Math.round((Number(anguloActual) + delta) * 10) / 10;
    if (nuevo >= 0 && nuevo <= 360) {
      setValue('angulo_grados', nuevo, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RegistroAnguloFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await registrarAnguloAction(data);
      if (!res.success) {
        setServerError(res.error || 'Error al guardar medición');
      } else {
        setSuccessMessage(res.message || 'Medición guardada correctamente');
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
      {/* Retorno y Título */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <Link
          href="/registro"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al menú de registros</span>
        </Link>
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          Etapa 2: Divisora de Masa
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black !text-gray-900 sm:text-3xl">
          Registro de Ángulo de Divisora
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Ingrese la calibración angular de corte. Si el ángulo sale del rango programado ({anguloMin}° a {anguloMax}°), el sistema alertará visualmente al supervisor.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
          <div className="text-sm font-semibold">{serverError}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <div className="text-sm font-semibold">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Selección de Equipo y Lote */}
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <label className="block text-sm font-bold uppercase text-gray-900">
              Equipo Divisora
            </label>
            <select
              value={selectedEquipoId}
              onChange={(e) => {
                setSelectedEquipoId(e.target.value);
                setValue('equipo_id', e.target.value);
              }}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.codigo} - {eq.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800">
              Lote Asociado (Opcional)
            </label>
            <select
              {...register('lote_id')}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-sm font-medium text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="">-- Sin vincular a lote específico --</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.codigo_lote}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Táctil de Ángulo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm sm:p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Ángulo de Calibración
          </span>

          <div className="my-4 flex items-center justify-center">
            <div
              className={`rounded-2xl border-2 px-8 py-4 font-mono text-5xl font-black transition-colors sm:text-6xl ${enRango
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-red-300 bg-red-50 text-red-700 shadow-md shadow-red-100'
                }`}
            >
              {Number(anguloActual).toFixed(1)}°
            </div>
          </div>

          {/* Rango Permitido y Estado */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold">
            {enRango ? (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Dentro de Rango ([{anguloMin}° a {anguloMax}°])
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                FUERA DE RANGO ([{anguloMin}° a {anguloMax}°]) - Generará Alerta
              </span>
            )}
          </div>

          {/* Botones de Ajuste Rápido Táctil */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => ajustarAngulo(-5)}
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <Minus className="mr-0.5 h-4 w-4" /> 5°
            </button>
            <button
              type="button"
              onClick={() => ajustarAngulo(-1)}
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <Minus className="mr-0.5 h-4 w-4" /> 1°
            </button>
            <button
              type="button"
              onClick={() => ajustarAngulo(1)}
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <Plus className="mr-0.5 h-4 w-4" /> 1°
            </button>
            <button
              type="button"
              onClick={() => ajustarAngulo(5)}
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <Plus className="mr-0.5 h-4 w-4" /> 5°
            </button>
          </div>

          {/* Input Numérico Directo para Teclado de Celular */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              O escriba el valor con teclado numérico:
            </label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              {...register('angulo_grados')}
              className="mx-auto min-h-[48px] max-w-[200px] rounded-xl border border-gray-300 bg-gray-50 text-center font-mono text-xl font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            />
            {errors.angulo_grados && (
              <p className="mt-1 text-xs font-bold text-red-600">
                {errors.angulo_grados.message}
              </p>
            )}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-bimbo-red px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-bimbo-red/30 transition-all hover:bg-bimbo-redHover disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Guardando medición...</span>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                <span>Guardar Ángulo de Divisora</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}