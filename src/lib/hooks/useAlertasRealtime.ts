'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../supabase/client';
import { Database } from '../types/database.types';

type AlertaRow = Database['public']['Tables']['alertas']['Row'];

export function useAlertasRealtime(
  initialAlertas: AlertaRow[],
  lineaId?: string | null
) {
  const [alertas, setAlertas] = useState<AlertaRow[]>(initialAlertas);
  const [nuevaAlertaCritica, setNuevaAlertaCritica] = useState<AlertaRow | null>(null);
  const supabase = createClient();

  // Actualizar estado si cambian las iniciales
  useEffect(() => {
    setAlertas(initialAlertas);
  }, [initialAlertas]);

  useEffect(() => {
    // Suscripción al canal Realtime de postgres_changes en la tabla 'alertas'
    const channel = supabase
      .channel('alertas-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'alertas',
        },
        (payload) => {
          const newRow = payload.new as AlertaRow;
          const oldRow = payload.old as AlertaRow;

          if (payload.eventType === 'INSERT') {
            // Filtrar por línea si el usuario es encargado
            if (!lineaId || newRow.linea_id === lineaId) {
              setAlertas((prev) => [newRow, ...prev.filter((a) => a.id !== newRow.id)]);
              if (newRow.estado === 'ACTIVA') {
                setNuevaAlertaCritica(newRow);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setAlertas((prev) =>
              prev.map((a) => (a.id === newRow.id ? newRow : a))
            );
          } else if (payload.eventType === 'DELETE') {
            setAlertas((prev) => prev.filter((a) => a.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, lineaId]);

  const dismissBanner = useCallback(() => {
    setNuevaAlertaCritica(null);
  }, []);

  const activasCount = alertas.filter((a) => a.estado === 'ACTIVA').length;
  const criticasCount = alertas.filter(
    (a) => a.estado === 'ACTIVA' && a.severidad === 'CRITICA'
  ).length;

  return {
    alertas,
    activasCount,
    criticasCount,
    nuevaAlertaCritica,
    dismissBanner,
  };
}
