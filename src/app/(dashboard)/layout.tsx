import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type LineaRow = Database['public']['Tables']['lineas']['Row'];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener perfil del usuario
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profileData) {
    redirect('/login');
  }

  const profile = profileData as ProfileRow;

  // Obtener información de línea si tiene una asignada
  let linea: LineaRow | null = null;
  if (profile.linea_id) {
    const { data: lineaData } = await supabase
      .from('lineas')
      .select('*')
      .eq('id', profile.linea_id)
      .single();
    linea = lineaData as LineaRow | null;
  }

  // Obtener conteo de alertas activas según rol
  let alertasQuery = supabase
    .from('alertas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'ACTIVA');

  if (profile.rol === 'ENCARGADO' && profile.linea_id) {
    alertasQuery = alertasQuery.eq('linea_id', profile.linea_id);
  }

  const { count: alertasCount } = await alertasQuery;

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 text-gray-900">
      {/* Header fijo superior */}
      <Header
        profile={profile}
        linea={linea}
        alertasActivasCount={alertasCount || 0}
      />

      {/* Contenido principal con padding inferior para la barra móvil */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-8">
        {children}
      </main>

      {/* Barra de navegación inferior móvil */}
      <BottomNav rol={profile.rol} alertasActivasCount={alertasCount || 0} />
    </div>
  );
}
