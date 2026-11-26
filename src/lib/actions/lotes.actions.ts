'use server';

import { createClient } from '../supabase/server';
import {
  crearLoteBatidaSchema,
  CrearLoteBatidaFormData,
  avanzarLoteSchema,
  AvanzarLoteFormData,
} from '../schemas/registros.schema';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './auth.actions';

export async function crearLoteConBatidaAction(
  data: CrearLoteBatidaFormData
): Promise<ActionResponse & { lote_id?: string }> {
  const parsed = crearLoteBatidaSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Datos de lote inválidos',
    };
  }

  const supabase = createClient();
  const tiempoTotalSeg = parsed.data.minutos * 60 + parsed.data.segundos;

  if (tiempoTotalSeg <= 0) {
    return {
      success: false,
      error: 'El tiempo total de batido debe ser mayor a 0 segundos',
    };
  }

  try {
    const { data: loteId, error } = await (supabase.rpc as any)('crear_lote_con_batida', {
      p_orden_id: parsed.data.orden_id,
      p_codigo_lote: parsed.data.codigo_lote.trim().toUpperCase(),
      p_equipo_batidora_id: parsed.data.equipo_batidora_id,
      p_tiempo_batido_seg: tiempoTotalSeg,
      p_observaciones: parsed.data.observaciones || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/registro');
    return { success: true, lote_id: loteId as string, message: 'Lote creado e iniciado en Batidora correctamente' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear lote';
    return { success: false, error: msg };
  }
}

export async function avanzarLoteAction(
  data: AvanzarLoteFormData
): Promise<ActionResponse> {
  const parsed = avanzarLoteSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Datos de avance inválidos',
    };
  }

  const supabase = createClient();

  try {
    const { error } = await (supabase.rpc as any)('avanzar_lote', {
      p_lote_id: parsed.data.lote_id,
      p_etapa_destino_id: parsed.data.etapa_destino_id,
      p_observaciones: parsed.data.observaciones || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/registro/avance-lote');
    return { success: true, message: 'Lote avanzado a la siguiente etapa correctamente' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al avanzar lote';
    return { success: false, error: msg };
  }
}
