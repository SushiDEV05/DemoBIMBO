'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { crearLoteBatidaSchema, CrearLoteBatidaFormData } from '@/lib/schemas/registros.schema';
import { crearLoteConBatidaAction } from '@/lib/actions/lotes.actions';
import CronometroBatidora from '@/components/forms/CronometroBatidora';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { Database } from '@/lib/types/database.types';

type OrdenRow = Database['public']['Tables']['ordenes_produccion']['Row'];
type RecetaRow = Database['public']['Tables']['recetas']['Row'];
type ProductoRow = Database['public']['Tables']['productos']['Row'];
type EquipoRow = Database['public']['Tables']['equipos']['Row'];

interface BatidoraFormClientProps {
  ordenes: (OrdenRow & { productos: ProductoRow; recetas: RecetaRow })[];
  equipos: (EquipoRow & { etapas_linea: { tipo: string; linea_id: string } })[];
  userLineaId?: string | null;
}

export default function BatidoraFormClient({
  ordenes,
  equipos,
  userLineaId,
}: BatidoraFormClientProps) {
  const router = useRouter();
  const [selectedOrdenId, setSelectedOrdenId] = useState<string>(
    ordenes[0]?.id || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ message: string; lote_id?: string } | null>(null);

  const selectedOrden = ordenes.find((o) => o.id === selectedOrdenId);

  const equiposDisponibles = equipos.filter(
    (e) => !selectedOrden || e.etapas_linea.linea_id === selectedOrden.linea_id
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CrearLoteBatidaFormData>({
    resolver: zodResolver(crearLoteBatidaSchema),
    defaultValues: {
      orden_id: ordenes[0]?.id || '',
      codigo_lote: '',
      equipo_batidora_id: equiposDisponibles[0]?.id || '',
      minutos: selectedOrden ? Math.floor(selectedOrden.recetas.tiempo_objetivo_seg / 60) : 8,
      segundos: selectedOrden ? selectedOrden.recetas.tiempo_objetivo_seg % 60 : 0,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (selectedOrden) {
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefijo = selectedOrden.codigo_orden.split('-')[1] || 'LOT';
      const seq = String(selectedOrden.producido_recetas + 1).padStart(3, '0');
      const codigoGenerado = `LOT-${prefijo}-${fecha}-${seq}`;
      setValue('codigo_lote', codigoGenerado);
      setValue('orden_id', selectedOrden.id);
      if (equiposDisponibles[0]) {
        setValue('equipo_batidora_id', equiposDisponibles[0].id);
      }
    }
  }, [selectedOrdenId, selectedOrden, setValue]);

  const handleCronometroTimeChange = (mins: number, secs: number) => {
    setValue('minutos', mins, { shouldValidate: true });
    setValue('segundos', secs, { shouldValidate: true });
  };

  const onSubmit = async (data: CrearLoteBatidaFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessResult(null);

    try {
      const res = await crearLoteConBatidaAction(data);
      if (!res.success) {
        setServerError(res.error || 'Error al registrar batida y crear lote');
      } else {
        setSuccessResult({
          message: res.message || 'Lote creado exitosamente',
          lote_id: res.lote_id,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutos = watch('minutos');
  const segundos = watch('segundos');
  const tiempoTotalSeg = (Number(minutos) || 0) * 60 + (Number(segundos) || 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24 text-gray-900">
      {/* Barra de Retorno y Título */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <Link
          href="/registro"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al menú de registros</span>
        </Link>
        <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          Etapa 1: Batidora Industrial
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black !text-gray-900 sm:text-3xl">
          Registro de Batidora y Creación de Lote
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Inicia la trazabilidad del lote desde la Etapa 1. Al guardar, el sistema descontará automáticamente 1 receta de la orden de producción.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
          <div className="text-sm">
            <span className="font-bold">Error en Registro: </span>
            {serverError}
          </div>
        </div>
      )}

      {successResult && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <p className="text-base font-bold">{successResult.message}</p>
              <p className="text-xs text-emerald-700">
                La receta fue descontada de la orden y el lote se encuentra activo en la Etapa 1 (Batidora).
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/flujo"
              className="flex min-h-[42px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Ver en Tablero de Flujo
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                router.refresh();
              }}
              className="flex min-h-[42px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Registrar Otra Batida
            </button>
          </div>
        </div>
      )}

      {ordenes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Layers className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-3 text-lg font-bold !text-gray-900">No hay órdenes en proceso</h3>
          <p className="mt-1 text-sm text-gray-500">
            Se requiere que un Supervisor cree una orden de producción activa antes de registrar lotes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 1. Selector de Orden de Producción */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-900">
              1. Seleccione Orden de Producción
            </label>
            <div className="mt-2">
              <select
                value={selectedOrdenId}
                onChange={(e) => setSelectedOrdenId(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
              >
                {ordenes.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.codigo_orden} - {op.productos.nombre} (Turno {op.turno})
                  </option>
                ))}
              </select>
            </div>

            {selectedOrden && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-gray-500">Producto:</span>
                  <p className="font-bold text-gray-900">{selectedOrden.productos.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fórmula / Receta:</span>
                  <p className="font-bold text-amber-700">{selectedOrden.recetas.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Objetivo Batido:</span>
                  <p className="font-bold text-gray-900">
                    {Math.floor(selectedOrden.recetas.tiempo_objetivo_seg / 60)}m{' '}
                    {selectedOrden.recetas.tiempo_objetivo_seg % 60}s (±{selectedOrden.recetas.tolerancia_pct}%)
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Recetas (Plan/Prod/Rest):</span>
                  <p className="font-bold text-emerald-700">
                    {selectedOrden.total_planificado_recetas} / {selectedOrden.producido_recetas} /{' '}
                    <strong className="text-amber-700">{selectedOrden.restante_recetas} restantes</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Código de Lote y Batidora */}
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-gray-800">
                  Código de Lote
                </label>
                <input
                  type="text"
                  {...register('codigo_lote')}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 font-mono text-sm font-bold uppercase text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
                  placeholder="LOT-PAN-20261121-001"
                />
                {errors.codigo_lote && (
                  <p className="mt-1 text-xs font-bold text-red-600">{errors.codigo_lote.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800">
                  Equipo Batidora
                </label>
                <select
                  {...register('equipo_batidora_id')}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
                >
                  {equiposDisponibles.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo} - {eq.nombre}
                    </option>
                  ))}
                </select>
                {errors.equipo_batidora_id && (
                  <p className="mt-1 text-xs font-bold text-red-600">
                    {errors.equipo_batidora_id.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Cronómetro Táctil Integrado */}
          <CronometroBatidora
            tiempoObjetivoSeg={selectedOrden?.recetas.tiempo_objetivo_seg || 480}
            toleranciaPct={Number(selectedOrden?.recetas.tolerancia_pct) || 5}
            onTimeChange={handleCronometroTimeChange}
            initialMinutes={watch('minutos')}
            initialSeconds={watch('segundos')}
          />

          {/* 4. Inputs Numéricos Manuales (Touch) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Tiempo Final Registrado (Minutos y Segundos)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Minutos</label>
                <input
                  type="number"
                  inputMode="numeric"
                  {...register('minutos')}
                  className="min-h-[52px] w-full rounded-xl border border-gray-300 bg-gray-50 text-center font-mono text-2xl font-black text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
                />
                {errors.minutos && (
                  <p className="mt-1 text-xs font-bold text-red-600">{errors.minutos.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Segundos</label>
                <input
                  type="number"
                  inputMode="numeric"
                  {...register('segundos')}
                  className="min-h-[52px] w-full rounded-xl border border-gray-300 bg-gray-50 text-center font-mono text-2xl font-black text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
                />
                {errors.segundos && (
                  <p className="mt-1 text-xs font-bold text-red-600">{errors.segundos.message}</p>
                )}
              </div>
            </div>

            <p className="mt-2.5 text-center text-xs text-gray-600">
              Total equivalente:{' '}
              <strong className="font-mono font-bold text-gray-900">{tiempoTotalSeg} segundos</strong>
            </p>
          </div>

          {/* 5. Observaciones */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <label className="block text-sm font-bold text-gray-900">
              Observaciones del Batido (Opcional)
            </label>
            <textarea
              rows={2}
              {...register('observaciones')}
              placeholder="Ej: Masa uniforme, consistencia adecuada..."
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            />
          </div>

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-bimbo-red px-6 py-4 text-lg font-bold text-white shadow-lg shadow-bimbo-red/30 transition-all hover:bg-bimbo-redHover disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Procesando y descontando receta...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-6 w-6" />
                  <span>Crear Lote y Confirmar Batida</span>
                </div>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}