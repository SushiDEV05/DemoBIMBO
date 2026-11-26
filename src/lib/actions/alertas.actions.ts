'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './auth.actions';
import { Database } from '../types/database.types';

type ProfileRol = Pick<Database['public']['Tables']['profiles']['Row'], 'rol'>;

export async function reconocerAlertaAction(
  alertaId: string,
  comentario: string
): Promise<ActionResponse> {
  if (!alertaId) {
    return { success: false, error: 'Identificador de alerta inválido' };
  }

  if (!comentario || comentario.trim().length < 5) {
    return {
      success: false,
      error: 'Debe ingresar un comentario obligatorio detallando la causa o acción correctiva (mínimo 5 caracteres).',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Verificar rol
  const { data: profileData } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  const profile = profileData as ProfileRol | null;

  if (!profile || (profile.rol !== 'SUPERVISOR' && profile.rol !== 'GERENCIA')) {
    return {
      success: false,
      error: 'Permiso denegado: solo Supervisores y Gerencia pueden reconocer alertas.',
    };
  }

  try {
    const { error } = await (supabase.from('alertas') as any)
      .update({
        estado: 'RECONOCIDA',
        reconocida_por: user.id,
        reconocida_at: new Date().toISOString(),
        comentario_reconocimiento: comentario.trim(),
      })
      .eq('id', alertaId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/alertas');
    revalidatePath('/');
    revalidatePath('/flujo');
    return { success: true, message: 'Alerta reconocida exitosamente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al reconocer alerta';
    return { success: false, error: msg };
  }
}

export async function cerrarAlertaAction(alertaId: string): Promise<ActionResponse> {
  if (!alertaId) {
    return { success: false, error: 'Identificador de alerta inválido' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Verificar rol
  const { data: profileData } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  const profile = profileData as ProfileRol | null;

  if (!profile || (profile.rol !== 'SUPERVISOR' && profile.rol !== 'GERENCIA')) {
    return {
      success: false,
      error: 'Permiso denegado: solo Supervisores y Gerencia pueden cerrar alertas.',
    };
  }

  try {
    const { error } = await (supabase.from('alertas') as any)
      .update({
        estado: 'CERRADA',
        cerrada_por: user.id,
        cerrada_at: new Date().toISOString(),
      })
      .eq('id', alertaId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/alertas');
    revalidatePath('/');
    revalidatePath('/flujo');
    return { success: true, message: 'Alerta cerrada y archivada formalmente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cerrar alerta';
    return { success: false, error: msg };
  }
}