'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';

interface CronometroBatidoraProps {
  tiempoObjetivoSeg?: number;
  toleranciaPct?: number;
  onTimeChange: (minutos: number, segundos: number) => void;
  initialMinutes?: number;
  initialSeconds?: number;
}

export default function CronometroBatidora({
  tiempoObjetivoSeg = 480, // 8 min por defecto
  toleranciaPct = 5,
  onTimeChange,
  initialMinutes = 0,
  initialSeconds = 0,
}: CronometroBatidoraProps) {
  const [segundosTotales, setSegundosTotales] = useState(
    initialMinutes * 60 + initialSeconds
  );
  const [activo, setActivo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activo) {
      timerRef.current = setInterval(() => {
        setSegundosTotales((prev) => {
          const next = prev + 1;
          const mins = Math.floor(next / 60);
          const secs = next % 60;
          onTimeChange(mins, secs);
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activo, onTimeChange]);

  const toggleTimer = () => {
    setActivo((prev) => !prev);
  };

  const resetTimer = () => {
    setActivo(false);
    setSegundosTotales(0);
    onTimeChange(0, 0);
  };

  const ajustarSegundos = (delta: number) => {
    setSegundosTotales((prev) => {
      const next = Math.max(0, prev + delta);
      const mins = Math.floor(next / 60);
      const secs = next % 60;
      onTimeChange(mins, secs);
      return next;
    });
  };

  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Cálculo de Tolerancia
  const minSeg = Math.round(tiempoObjetivoSeg * (1 - toleranciaPct / 100));
  const maxSeg = Math.round(tiempoObjetivoSeg * (1 + toleranciaPct / 100));
  const enTolerancia = segundosTotales >= minSeg && segundosTotales <= maxSeg;
  const desvio = tiempoObjetivoSeg > 0 ? ((segundosTotales - tiempoObjetivoSeg) / tiempoObjetivoSeg) * 100 : 0;

  return (
    <div className="card-industrial p-4 sm:p-5 border-slate-800 bg-slate-900/90">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm uppercase">
          <Clock className="h-4 w-4 text-bimbo-red" />
          <span>Cronómetro Táctil de Batidora</span>
        </div>
        <div className="text-right text-xs text-slate-400">
          Objetivo Receta:{' '}
          <strong className="text-amber-400">
            {Math.floor(tiempoObjetivoSeg / 60)}m {tiempoObjetivoSeg % 60}s (±{toleranciaPct}%)
          </strong>
        </div>
      </div>

      {/* Display Digital Gigante */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div
          className={`relative rounded-2xl px-8 py-4 font-mono text-5xl sm:text-6xl font-black tracking-widest border transition-all ${
            segundosTotales === 0
              ? 'bg-slate-950 text-slate-300 border-slate-800'
              : enTolerancia
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/70 shadow-lg shadow-emerald-950/50'
              : 'bg-red-950/40 text-red-300 border-red-600/70 shadow-lg shadow-red-950/50'
          }`}
        >
          {pad(minutos)}:{pad(segundos)}
          {activo && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Indicador de Desviación */}
        {segundosTotales > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold">
            {enTolerancia ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Dentro de Tolerancia ({desvio >= 0 ? `+${desvio.toFixed(1)}%` : `${desvio.toFixed(1)}%`})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Fuera de Tolerancia ({desvio >= 0 ? `+${desvio.toFixed(1)}%` : `${desvio.toFixed(1)}%`})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botones de Control Táctil Grande */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={toggleTimer}
          className={`btn-touch text-white text-base ${
            activo
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/50'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/50'
          }`}
        >
          {activo ? (
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              <span>Pausar</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              <span>{segundosTotales > 0 ? 'Reanudar' : 'Iniciar'}</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="btn-touch bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Poner en 0</span>
          </div>
        </button>

        {/* Ajustes rápidos táctiles */}
        <button
          type="button"
          onClick={() => ajustarSegundos(15)}
          className="btn-touch bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-sm font-semibold"
        >
          <Plus className="mr-1 h-4 w-4" />
          <span>+15 seg</span>
        </button>

        <button
          type="button"
          onClick={() => ajustarSegundos(-15)}
          className="btn-touch bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-sm font-semibold"
        >
          <Minus className="mr-1 h-4 w-4" />
          <span>-15 seg</span>
        </button>
      </div>

      <div className="mt-3 text-center text-[11px] text-slate-400">
        Rango Aceptado de Batido: <strong>{pad(Math.floor(minSeg / 60))}:{pad(minSeg % 60)}</strong> a{' '}
        <strong>{pad(Math.floor(maxSeg / 60))}:{pad(maxSeg % 60)}</strong>
      </div>
    </div>
  );
}
