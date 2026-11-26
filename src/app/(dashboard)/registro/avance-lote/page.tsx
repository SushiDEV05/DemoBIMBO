import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AvanceLoteClient from './AvanceLoteClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function AvanceLotePage() {
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

  // Obtener lotes activos EN_PROCESO con sus etapas y líneas
  let query = supabase
    .from('lotes')
    .select('*, etapas_linea(*), ordenes_produccion(*, productos(*), lineas(*))')
    .eq('estado', 'EN_PROCESO')
    .order('created_at', { ascending: false });

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    query = query.eq('etapas_linea.linea_id', profile.linea_id);
  }

  const { data: lotesData } = await query;
  const lotes = (lotesData || []) as any[];

  // Obtener todas las etapas ordenadas por línea
  const { data: etapasData } = await supabase
    .from('etapas_linea')
    .select('*')
    .order('orden');

  const etapas = (etapasData || []) as any[];

  return (
    <div className="space-y-6">
      <AvanceLoteClient
        lotes={lotes}
        todasLasEtapas={etapas}
        userLineaId={profile?.linea_id}
      />
    </div>
  );
}
