import React from 'react';
import { createClient } from '@/lib/supabase/server';
import DivisoraFormClient from './DivisoraFormClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type EquipoRow = Database['public']['Tables']['equipos']['Row'];

export default async function RegistroDivisoraPage() {
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

  // Obtener divisoras
  const { data: equiposData } = await supabase
    .from('equipos')
    .select('*, etapas_linea!inner(tipo, linea_id, nombre)')
    .eq('etapas_linea.tipo', 'DIVISORA');

  const equipos = (equiposData || []) as (EquipoRow & {
    etapas_linea: { tipo: string; linea_id: string; nombre: string };
  })[];

  // Obtener lotes activos en proceso
  let lotesQuery = supabase
    .from('lotes')
    .select('id, codigo_lote, etapa_actual_id, etapas_linea!inner(linea_id)')
    .eq('estado', 'EN_PROCESO');

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    lotesQuery = lotesQuery.eq('etapas_linea.linea_id', profile.linea_id);
  }

  const { data: lotesData } = await lotesQuery;
  const lotes = (lotesData || []) as any[];

  return (
    <div className="space-y-6">
      <DivisoraFormClient
        equipos={equipos}
        lotes={lotes}
        userLineaId={profile?.linea_id}
      />
    </div>
  );
}
