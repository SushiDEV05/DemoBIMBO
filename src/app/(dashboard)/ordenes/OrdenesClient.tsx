'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  Layers,
  Plus,
  TrendingDown,
  X,
} from 'lucide-react';
import { TurnoCodigo } from '@/lib/types/database.types';
import { crearOrdenAction } from '@/lib/actions/ordenes.actions';
import { useRouter } from 'next/navigation';

interface OrdenesClientProps {
  ordenes: any[];
  lineas: any[];
  productos: any[];
  recetas: any[];
  userProfile: any;
}

export default function OrdenesClient({
  ordenes,
  lineas,
  productos,
  recetas,
  userProfile,
}: OrdenesClientProps) {
  const router = useRouter();
  const [filtroEstado, setFiltroEstado] = useState<string>('EN_PROCESO');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Formulario Nueva Orden
  const [lineaId, setLineaId] = useState<string>(lineas[0]?.id || '');
  const [productoId, setProductoId] = useState<string>(productos[0]?.id || '');
  const [recetaId, setRecetaId] = useState<string>(recetas[0]?.id || '');
  const [codigoOrden, setCodigoOrden] = useState<string>('');
  const [turno, setTurno] = useState<TurnoCodigo>('MANANA');
  const [totalPlanificado, setTotalPlanificado] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const rol = userProfile?.rol || 'ENCARGADO';
  const puedeCrear = rol === 'SUPERVISOR' || rol === 'GERENCIA';

  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtroEstado !== 'TODAS' && o.estado !== filtroEstado) return false;
    return true;
  });

  // Generar código sugerido
  const handleOpenCreate = () => {
    const l = lineas.find((x) => x.id === lineaId);
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(ordenes.length + 1).padStart(3, '0');
    setCodigoOrden(`OP-${fecha}-${l?.codigo || 'PAN'}-${seq}`);
    setShowCreateModal(true);
    setModalError(null);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await crearOrdenAction({
        linea_id: lineaId,
        producto_id: productoId,
        receta_id: recetaId,
        codigo_orden: codigoOrden,
        turno: turno,
        total_planificado_recetas: Number(totalPlanificado),
        porcentaje_alerta_restante: 10.0,
      });

      if (!res.success) {
        setModalError(res.error || 'Error al crear orden');
      } else {
        setShowCreateModal(false);
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
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-950 px-2 py-0.5 text-xs font-bold text-blue-300 border border-blue-800">
              Descuento Automático Transaccional
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Órdenes de Producción y Recetas Restantes
          </h1>
          <p className="text-xs text-slate-300">
            Cada batida registrada descuenta automáticamente 1 receta del saldo disponible mediante trigger atómico en PostgreSQL.
          </p>
        </div>

        {puedeCrear && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-touch bg-bimbo-red text-white text-sm font-bold shadow-lg shadow-bimbo-red/30 hover:bg-bimbo-redHover px-4"
          >
            <Plus className="mr-1.5 h-5 w-5" />
            <span>Nueva Orden de Producción</span>
          </button>
        )}
      </div>

      {/* Pestañas de Estado */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFiltroEstado('EN_PROCESO')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filtroEstado === 'EN_PROCESO'
              ? 'bg-bimbo-blue text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          En Proceso (Activas)
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('COMPLETADA')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filtroEstado === 'COMPLETADA'
              ? 'bg-bimbo-blue text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Completadas
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('TODAS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            filtroEstado === 'TODAS'
              ? 'bg-bimbo-blue text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Grid de Órdenes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenesFiltradas.map((op) => {
          const plan = op.total_planificado_recetas;
          const prod = op.producido_recetas;
          const rest = op.restante_recetas;
          const porcentajeAvance = Math.min(100, Math.round((prod / plan) * 100));
          const esCritico = rest <= plan * (op.porcentaje_alerta_restante / 100);
          const esCompletada = op.estado === 'COMPLETADA' || rest === 0;

          return (
            <div
              key={op.id}
              className={`card-industrial p-5 transition-all border ${
                esCompletada
                  ? 'border-emerald-800/50 bg-emerald-950/10'
                  : esCritico
                  ? 'border-amber-600/70 bg-amber-950/15 shadow-md shadow-amber-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-white">
                  {op.codigo_orden}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    esCompletada
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : esCritico
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {op.estado}
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-white truncate">
                {op.productos?.nombre}
              </h3>
              <p className="text-xs text-amber-300 truncate">
                Receta: {op.recetas?.nombre}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Progreso de Recetas:</span>
                  <span className="font-mono font-bold text-white">
                    {prod} / {plan} ({porcentajeAvance}%)
                  </span>
                </div>

                {/* Barra de Progreso */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      esCompletada
                        ? 'bg-emerald-500'
                        : esCritico
                        ? 'bg-amber-500'
                        : 'bg-bimbo-red'
                    }`}
                    style={{ width: `${porcentajeAvance}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Restante Disponible:</span>
                  <strong
                    className={`font-mono text-sm ${
                      rest === 0
                        ? 'text-emerald-400'
                        : esCritico
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {rest} recetas
                  </strong>
                </div>

                {esCritico && !esCompletada && (
                  <div className="rounded-lg bg-amber-950/60 p-2 text-[11px] font-semibold text-amber-300 border border-amber-800/40 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Nivel crítico: resta $\le 10\%$ de la orden.</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Línea: <strong className="text-slate-300">{op.lineas?.nombre}</strong></span>
                <span>Turno {op.turno}</span>
              </div>
            </div>
          );
        })}

        {ordenesFiltradas.length === 0 && (
          <div className="col-span-full card-industrial p-12 text-center text-slate-400">
            <Layers className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-lg font-bold text-white">No hay órdenes en este estado</h3>
            <p className="mt-1 text-xs">Cree una nueva orden de producción para iniciar el turno.</p>
          </div>
        )}
      </div>

      {/* Modal Nueva Orden de Producción */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card-industrial w-full max-w-lg border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Factory className="h-5 w-5 text-bimbo-red" />
                <span>Programar Nueva Orden de Producción</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-950/80 p-2.5 text-xs font-semibold text-red-300 border border-red-800">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Código de Orden
                </label>
                <input
                  type="text"
                  required
                  value={codigoOrden}
                  onChange={(e) => setCodigoOrden(e.target.value)}
                  className="input-touch w-full border border-slate-700 bg-slate-950 text-white font-mono uppercase focus:border-bimbo-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Línea
                  </label>
                  <select
                    value={lineaId}
                    onChange={(e) => setLineaId(e.target.value)}
                    className="input-touch w-full border border-slate-700 bg-slate-950 text-white font-semibold focus:border-bimbo-red"
                  >
                    {lineas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Turno
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as TurnoCodigo)}
                    className="input-touch w-full border border-slate-700 bg-slate-950 text-white font-semibold focus:border-bimbo-red"
                  >
                    <option value="MANANA">Mañana</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOCHE">Noche</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Producto a Fabricar
                </label>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="input-touch w-full border border-slate-700 bg-slate-950 text-white focus:border-bimbo-red"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Fórmula / Receta
                </label>
                <select
                  value={recetaId}
                  onChange={(e) => setRecetaId(e.target.value)}
                  className="input-touch w-full border border-slate-700 bg-slate-950 text-white focus:border-bimbo-red"
                >
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.tiempo_objetivo_seg}s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Total Planificado de Recetas (CHECK &gt; 0)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalPlanificado}
                  onChange={(e) => setTotalPlanificado(parseInt(e.target.value, 10))}
                  className="input-touch w-full border border-slate-700 bg-slate-950 text-center font-mono text-xl font-bold text-white focus:border-bimbo-red"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-touch bg-slate-800 text-slate-300 border border-slate-700 px-4 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-touch bg-bimbo-red text-white px-5 text-sm font-bold hover:bg-bimbo-redHover shadow-lg shadow-bimbo-red/40 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando orden...' : 'Confirmar Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
