import React from 'react';
import { createClient } from '@/lib/supabase/server';
import OrdenesClient from './OrdenesClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function OrdenesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, lineas(*)')
    .eq('id', user?.id || '')
    .single();

  const profile = profileData as ProfileRow | null;

  // Obtener órdenes de producción
  let query = supabase
    .from('ordenes_produccion')
    .select('*, lineas(nombre, codigo), productos(nombre, codigo), recetas(nombre, tiempo_objetivo_seg)')
    .order('created_at', { ascending: false });

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    query = query.eq('linea_id', profile.linea_id);
  }

  const { data: ordenesData } = await query;
  const ordenes = (ordenesData || []) as any[];

  // Obtener catálogos para formulario de nueva orden
  const [{ data: lineasData }, { data: productosData }, { data: recetasData }] = await Promise.all([
    supabase.from('lineas').select('*').order('codigo'),
    supabase.from('productos').select('*').order('nombre'),
    supabase.from('recetas').select('*').order('nombre'),
  ]);

  return (
    <div className="space-y-6">
      <OrdenesClient
        ordenes={ordenes}
        lineas={lineasData || []}
        productos={productosData || []}
        recetas={recetasData || []}
        userProfile={profile}
      />
    </div>
  );
}
