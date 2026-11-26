import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un formato de correo válido (ej: usuario@bimbo.com)'),
  password: z
    .string()
    .min(6, 'La contraseña debe contener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const recuperarSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un formato de correo válido'),
});

export type RecuperarFormData = z.infer<typeof recuperarSchema>;
