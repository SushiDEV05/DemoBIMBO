'use server';

import { createClient } from '../supabase/server';
import { loginSchema, LoginFormData, recuperarSchema, RecuperarFormData } from '../schemas/auth.schema';
import { redirect } from 'next/navigation';

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function loginAction(data: LoginFormData): Promise<ActionResponse> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Datos de formulario inválidos',
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error:
        error.message === 'Invalid login credentials'
          ? 'Credenciales incorrectas. Verifique su correo y contraseña.'
          : error.message,
    };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function recuperarPasswordAction(data: RecuperarFormData): Promise<ActionResponse> {
  const parsed = recuperarSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Correo inválido',
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/actualizar-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Se ha enviado un enlace de recuperación a su correo corporativo.',
  };
}
