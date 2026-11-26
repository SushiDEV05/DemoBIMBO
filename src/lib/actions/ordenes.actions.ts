'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './auth.actions';
import { TurnoCodigo } from '../types/database.types';

export interface CrearOrdenInput {
  linea_id: string;
  producto_id: string;
  receta_id: string;
  codigo_orden: string;
  turno: TurnoCodigo;
  total_planificado_recetas: number;
  porcentaje_alerta_restante?: number;
}

export async function crearOrdenAction(data: CrearOrdenInput): Promise<ActionResponse> {
  if (!data.linea_id || !data.producto_id || !data.receta_id || !data.codigo_orden) {
    return { success: false, error: 'Faltan campos obligatorios para la orden.' };
  }

  if (data.total_planificado_recetas <= 0) {
    return { success: false, error: 'El total planificado debe ser mayor a 0 recetas.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.rol !== 'SUPERVISOR' && profile.rol !== 'GERENCIA')) {
    return { success: false, error: 'Permiso denegado: solo Supervisores y Gerencia pueden crear órdenes.' };
  }

  try {
    const { error } = await (supabase.from('ordenes_produccion') as any).insert({
      codigo_orden: data.codigo_orden.trim().toUpperCase(),
      linea_id: data.linea_id,
      producto_id: data.producto_id,
      receta_id: data.receta_id,
      turno: data.turno,
      total_planificado_recetas: data.total_planificado_recetas,
      producido_recetas: 0,
      porcentaje_alerta_restante: data.porcentaje_alerta_restante ?? 10.0,
      estado: 'EN_PROCESO',
      created_by: user.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/ordenes');
    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/registro/batidora');
    return { success: true, message: 'Orden de producción creada e iniciada exitosamente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear orden';
    return { success: false, error: msg };
  }
}
