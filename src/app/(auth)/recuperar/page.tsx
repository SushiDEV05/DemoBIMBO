'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recuperarSchema, RecuperarFormData } from '@/lib/schemas/auth.schema';
import { recuperarPasswordAction } from '@/lib/actions/auth.actions';
import Link from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';

export default function RecuperarPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarFormData>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecuperarFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await recuperarPasswordAction(data);
      if (!res.success) {
        setServerError(res.error || 'Error al solicitar recuperación');
      } else {
        setSuccessMessage(res.message || 'Correo de restablecimiento enviado.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Recuperar Acceso</h2>
        <p className="text-sm text-slate-300">
          Ingrese su correo corporativo para recibir instrucciones de restablecimiento.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/60 p-4 text-red-200">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-400" />
          <div className="text-sm">
            <span className="font-bold">Error: </span>
            {serverError}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/50 bg-emerald-950/60 p-4 text-emerald-200">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
          <div className="text-sm font-semibold">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold tracking-wide text-slate-200">
            Correo Corporativo
          </label>
          <div className="mt-1">
            <input
              type="email"
              inputMode="email"
              placeholder="operador@bimbo.com"
              {...register('email')}
              className={`input-touch w-full border bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-700 focus:border-bimbo-red focus:ring-bimbo-red/50'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs font-semibold text-red-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-touch w-full bg-bimbo-red text-lg text-white shadow-lg shadow-bimbo-red/40 hover:bg-bimbo-redHover disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Enviando...</span>
          ) : (
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <span>Enviar Enlace</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-800 pt-4 text-center">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-bimbo-red hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio de sesión</span>
        </a>
      </div>
    </div>
  );
}
