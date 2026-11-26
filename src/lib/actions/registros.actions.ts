'use server';

import { createClient } from '../supabase/server';
import {
  registroAnguloSchema,
  RegistroAnguloFormData,
  registroTemperaturaSchema,
  RegistroTemperaturaFormData,
} from '../schemas/registros.schema';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './auth.actions';

export async function registrarAnguloAction(
  data: RegistroAnguloFormData
): Promise<ActionResponse> {
  const parsed = registroAnguloSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Datos de ángulo inválidos',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const { error } = await (supabase.from('registros_angulo') as any).insert({
      equipo_id: parsed.data.equipo_id,
      lote_id: parsed.data.lote_id || null,
      angulo_grados: parsed.data.angulo_grados,
      usuario_id: user.id,
      dentro_rango: true,
      turno: 'MANANA',
      fecha_turno: new Date().toISOString().split('T')[0],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/historial');
    return { success: true, message: 'Ángulo de divisora registrado exitosamente' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al registrar ángulo';
    return { success: false, error: msg };
  }
}

export async function registrarTemperaturaAction(
  data: RegistroTemperaturaFormData
): Promise<ActionResponse> {
  const parsed = registroTemperaturaSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Datos de temperatura inválidos',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const { error } = await (supabase.from('registros_temperatura') as any).insert({
      equipo_id: parsed.data.equipo_id,
      lote_id: parsed.data.lote_id || null,
      temperatura_c: parsed.data.temperatura_c,
      usuario_id: user.id,
      dentro_rango: true,
      turno: 'MANANA',
      fecha_turno: new Date().toISOString().split('T')[0],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/historial');
    return { success: true, message: 'Temperatura registrada exitosamente' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al registrar temperatura';
    return { success: false, error: msg };
  }
}
