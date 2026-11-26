import React from 'react';
import { createClient } from '@/lib/supabase/server';
import BatidoraFormClient from './BatidoraFormClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrdenRow = Database['public']['Tables']['ordenes_produccion']['Row'];
type RecetaRow = Database['public']['Tables']['recetas']['Row'];
type ProductoRow = Database['public']['Tables']['productos']['Row'];
type EquipoRow = Database['public']['Tables']['equipos']['Row'];

export default async function RegistroBatidoraPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single();

  const profile = profileData as ProfileRow | null;

  // Obtener órdenes de producción EN_PROCESO
  let query = supabase
    .from('ordenes_produccion')
    .select('*, productos(*), recetas(*)')
    .eq('estado', 'EN_PROCESO')
    .order('created_at', { ascending: false });

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    query = query.eq('linea_id', profile.linea_id);
  }

  const { data: ordenesData } = await query;
  const ordenes = (ordenesData || []) as (OrdenRow & {
    productos: ProductoRow;
    recetas: RecetaRow;
  })[];

  // Obtener equipos batidora
  const { data: equiposData } = await supabase
    .from('equipos')
    .select('*, etapas_linea!inner(tipo, linea_id)')
    .eq('etapas_linea.tipo', 'BATIDORA');

  const equipos = (equiposData || []) as (EquipoRow & {
    etapas_linea: { tipo: string; linea_id: string };
  })[];

  return (
    <div className="space-y-6">
      <BatidoraFormClient
        ordenes={ordenes}
        equipos={equipos}
        userLineaId={profile?.linea_id}
      />
    </div>
  );
}
