'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './auth.actions';

export async function anularRegistroAction(
  tabla: string,
  registroId: string,
  motivo: string
): Promise<ActionResponse> {
  if (!registroId || !tabla) {
    return { success: false, error: 'Parámetros inválidos para anulación.' };
  }

  if (!motivo || motivo.trim().length < 5) {
    return {
      success: false,
      error: 'Debe ingresar un motivo de anulación obligatorio (mínimo 5 caracteres).',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  // Verificar rol (Supervisor o Gerencia)
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.rol !== 'SUPERVISOR' && profile.rol !== 'GERENCIA')) {
    return {
      success: false,
      error: 'Permiso denegado: solo Supervisores y Gerencia pueden anular registros.',
    };
  }

  try {
    const { error } = await (supabase.rpc as any)('anular_registro', {
      p_tabla: tabla,
      p_id: registroId,
      p_motivo: motivo.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/historial');
    revalidatePath('/');
    revalidatePath('/flujo');
    revalidatePath('/ordenes');
    return {
      success: true,
      message:
        tabla === 'registros_batidora'
          ? 'Registro de batidora anulado exitosamente. Se ha revertido 1 receta a la orden de producción.'
          : 'Registro anulado correctamente con registro en auditoría.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al anular registro';
    return { success: false, error: msg };
  }
}
