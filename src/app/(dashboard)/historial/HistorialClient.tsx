'use client';

import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Filter,
  History,
  ShieldAlert,
  X,
} from 'lucide-react';
import { anularRegistroAction } from '@/lib/actions/historial.actions';
import { useRouter } from 'next/navigation';

interface HistorialClientProps {
  registros: any[];
  userProfile: any;
}

export default function HistorialClient({
  registros,
  userProfile,
}: HistorialClientProps) {
  const router = useRouter();

  // Estados de Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroTurno, setFiltroTurno] = useState<string>('TODOS');
  const [soloFueraRango, setSoloFueraRango] = useState<boolean>(false);
  const [filtroAnulados, setFiltroAnulados] = useState<string>('VALIDOS'); // VALIDOS, ANULADOS, TODOS

  // Modal de Anulación
  const [registroParaAnular, setRegistroParaAnular] = useState<any | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const rol = userProfile?.rol || 'ENCARGADO';
  const puedeAnular = rol === 'SUPERVISOR' || rol === 'GERENCIA';

  const registrosFiltrados = registros.filter((r) => {
    if (filtroTipo !== 'TODOS' && r.tipo !== filtroTipo) return false;
    if (filtroTurno !== 'TODOS' && r.turno !== filtroTurno) return false;
    if (soloFueraRango && r.dentro_rango) return false;
    if (filtroAnulados === 'VALIDOS' && r.anulado) return false;
    if (filtroAnulados === 'ANULADOS' && !r.anulado) return false;
    return true;
  });

  const handleOpenAnular = (registro: any) => {
    setRegistroParaAnular(registro);
    setMotivo('');
    setModalError(null);
    setFeedbackSuccess(null);
  };

  const handleConfirmAnular = async () => {
    if (!registroParaAnular) return;
    if (motivo.trim().length < 5) {
      setModalError('Debe ingresar un motivo obligatorio de al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await anularRegistroAction(
        registroParaAnular.tabla,
        registroParaAnular.id,
        motivo
      );
      if (!res.success) {
        setModalError(res.error || 'Error al anular registro');
      } else {
        setFeedbackSuccess(res.message || 'Registro anulado correctamente.');
        setRegistroParaAnular(null);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
              Auditoría & Trazabilidad
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black !text-gray-900 sm:text-3xl">
            Historial de Mediciones y Parámetros
          </h1>
          <p className="text-xs text-gray-600">
            Registro unificado de Batidoras, Divisoras y Temperaturas. Ningún registro se elimina: solo se anula con motivo por supervisión.
          </p>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-xs font-bold">{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600">
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filtros Reactivos</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Tipo de Medición
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="BATIDORA">Batidora Industrial</option>
              <option value="ANGULO">Ángulo Divisora</option>
              <option value="TEMPERATURA">Temperatura Térmica</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Turno
            </label>
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="TODOS">Todos los Turnos</option>
              <option value="MANANA">Turno Mañana</option>
              <option value="TARDE">Turno Tarde</option>
              <option value="NOCHE">Turno Noche</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-700">
              Estado de Validez
            </label>
            <select
              value={filtroAnulados}
              onChange={(e) => setFiltroAnulados(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold text-gray-900 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
            >
              <option value="VALIDOS">Solo Válidos (Vigentes)</option>
              <option value="ANULADOS">Solo Anulados</option>
              <option value="TODOS">Todos (Válidos y Anulados)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100/70">
              <input
                type="checkbox"
                checked={soloFueraRango}
                onChange={(e) => setSoloFueraRango(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-bimbo-red focus:ring-bimbo-red"
              />
              <span>Solo Fuera de Rango</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-3">
        {registrosFiltrados.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-4 shadow-sm transition-all ${r.anulado
              ? 'border-gray-200 bg-gray-50/70 opacity-75'
              : !r.dentro_rango
                ? 'border-red-300 bg-red-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700">
                    {r.tipo}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {r.equipo_codigo} - {r.equipo_nombre}
                  </span>
                  {r.lote_codigo !== 'N/A' && (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800">
                      Lote: {r.lote_codigo}
                    </span>
                  )}
                  {r.anulado ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                      ANULADO
                    </span>
                  ) : !r.dentro_rango ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                      DESVIACIÓN
                    </span>
                  ) : (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      DENTRO DE TOLERANCIA
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                  <div>
                    <span className="text-gray-500">Valor: </span>
                    <strong className={r.dentro_rango ? 'text-emerald-600' : 'text-red-600'}>
                      {r.valor_registrado}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Objetivo: </span>
                    <span className="font-semibold text-gray-800">{r.valor_esperado}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  <span>
                    Turno {r.turno} ({r.fecha_turno})
                  </span>
                  <span>•</span>
                  <span>
                    Registrado por:{' '}
                    <strong className="font-semibold text-gray-700">
                      {r.usuario_nombre || 'Operador'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(r.fecha_hora).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {r.anulado && r.motivo_anulacion && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                    <span className="font-bold">Motivo de Anulación: </span>
                    {r.motivo_anulacion}
                  </div>
                )}
              </div>

              {/* Botón de Anulación para Supervisor / Gerencia */}
              {puedeAnular && !r.anulado && (
                <div className="shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenAnular(r)}
                    className="flex min-h-[40px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-600 hover:text-white"
                  >
                    <Ban className="mr-1.5 h-4 w-4" />
                    <span>Anular Registro</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {registrosFiltrados.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <History className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="mt-3 text-lg font-bold !text-gray-900">
              No hay registros con los filtros seleccionados
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Ajuste los filtros para visualizar mediciones históricas.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Anulación Formal */}
      {registroParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-red-600">
                <ShieldAlert className="h-5 w-5" />
                <span>Anulación Formal de Registro</span>
              </div>
              <button
                type="button"
                onClick={() => setRegistroParaAnular(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
                <p className="font-bold text-gray-900">
                  {registroParaAnular.tipo}: {registroParaAnular.equipo_codigo} (
                  {registroParaAnular.valor_registrado})
                </p>
                <p className="text-gray-600">
                  Registrado el {new Date(registroParaAnular.fecha_hora).toLocaleString('es-PE')}
                </p>
                {registroParaAnular.tipo === 'BATIDORA' && (
                  <p className="mt-1 border-t border-gray-200 pt-1 text-[11px] font-bold text-amber-700">
                    ⚠️ Importante: Al anular esta batida, el trigger en base de datos revertirá automáticamente 1 receta a la orden de producción.
                  </p>
                )}
              </div>

              {modalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  {modalError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                  Motivo Obligatorio de Anulación *
                </label>
                <textarea
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Error tipográfico al digitar tiempo de batido; operador ingresó 80 seg en lugar de 480 seg."
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-bimbo-red focus:bg-white focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Mínimo 5 caracteres. La anulación no borra el dato: lo invalida y lo audita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setRegistroParaAnular(null)}
                className="min-h-[42px] rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAnular}
                className="min-h-[42px] rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-md shadow-red-600/25 transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}