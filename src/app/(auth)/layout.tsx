import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Encabezado Corporativo Bimbo */}
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Image
              src="/icons/logo-bimbo.png"
              alt="Logo Grupo Bimbo"
              width={200}
              height={110}
              priority
              className="h-auto w-44 object-contain"
            />
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-wider text-gray-900 uppercase sm:text-3xl">
            Control Crítico de Planta
          </h1>
          <p className="mt-1 text-sm font-bold tracking-wide text-gray-700 uppercase">
            Grupo Bimbo • Operaciones Industriales
          </p>
        </div>

        {/* Contenedor del Formulario */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 shadow-lg shadow-gray-200/60 sm:px-10">
            {children}
          </div>
        </div>

        {/* Pie de página con zona horaria */}
        <div className="mt-8 text-center text-xs font-medium text-gray-600">
          <p>Planta Industrial Bimbo • Zona Horaria: America/Lima (UTC-5)</p>
          <p className="mt-1">Acceso exclusivo para personal autorizado de planta</p>
        </div>
      </div>
    </div>
  );
}