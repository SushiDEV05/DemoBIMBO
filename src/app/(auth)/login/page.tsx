'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/schemas/auth.schema';
import { loginAction } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await loginAction(data);
      if (!res.success) {
        setServerError(res.error || 'Error al iniciar sesión');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado de conexión';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Bimbo2026!', { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div className="text-gray-900">
      {/* Encabezado del Formulario */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold !text-gray-900">Inicio de Turno</h2>
        <p className="mt-1 text-sm text-gray-600">
          Ingrese sus credenciales corporativas para acceder a su línea de producción.
        </p>
      </div>

      {/* Alerta de Error */}
      {serverError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
          <div className="text-sm">
            <span className="font-bold">Error de Acceso: </span>
            {serverError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Campo Correo */}
        <div>
          <label className="block text-sm font-semibold tracking-wide text-gray-800">
            Correo Corporativo
          </label>
          <div className="mt-1">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="operador@bimbo.com"
              {...register('email')}
              className={`min-h-[48px] w-full rounded-xl border bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${errors.email
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-gray-300 focus:border-bimbo-red focus:ring-bimbo-red/20'
                }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold tracking-wide text-gray-800">
              Contraseña
            </label>
            <Link
              href="/recuperar"
              className="text-xs font-semibold text-bimbo-red hover:underline"
            >
              ¿Olvidó su clave?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={`min-h-[48px] w-full rounded-xl border bg-gray-50 px-4 py-3 pr-12 text-base text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${errors.password
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-gray-300 focus:border-bimbo-red focus:ring-bimbo-red/20'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-800"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Botón Ingresar */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-bimbo-red py-3.5 text-lg font-bold text-white shadow-md shadow-bimbo-red/25 transition-all hover:bg-bimbo-redHover disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verificando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              <span>Ingresar a Planta</span>
            </div>
          )}
        </button>
      </form>

      {/* Selector Rápido de Usuarios Demo */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-700 uppercase">
          <span>Acceso Rápido para Evaluación Demo</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Haga clic en cualquiera de los roles para autocompletar las credenciales configuradas:
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2.5">
          {/* Rol 1 */}
          <button
            type="button"
            onClick={() => handleQuickFill('encargado@bimbo.com')}
            className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                EP
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Carlos Pérez (Encargado Pan)</p>
                <p className="text-xs font-medium text-blue-700">Línea PAN • Batidora & Empaquetado</p>
              </div>
            </div>
            <UserCheck className="h-5 w-5 shrink-0 text-blue-600" />
          </button>

          {/* Rol 2 */}
          <button
            type="button"
            onClick={() => handleQuickFill('supervisor@bimbo.com')}
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-xs font-bold text-white">
                SP
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Laura Gómez (Supervisora)</p>
                <p className="text-xs font-medium text-amber-700">Todas las Líneas • Anulación & Alertas</p>
              </div>
            </div>
            <UserCheck className="h-5 w-5 shrink-0 text-amber-600" />
          </button>

          {/* Rol 3 */}
          <button
            type="button"
            onClick={() => handleQuickFill('gerencia@bimbo.com')}
            className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-xs font-bold text-white">
                GP
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Roberto Morales (Gerencia)</p>
                <p className="text-xs font-medium text-purple-700">Global • Configuración & Auditoría</p>
              </div>
            </div>
            <UserCheck className="h-5 w-5 shrink-0 text-purple-600" />
          </button>
        </div>
      </div>
    </div>
  );
}