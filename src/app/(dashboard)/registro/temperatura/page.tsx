import React from 'react';
import { createClient } from '@/lib/supabase/server';
import TemperaturaFormClient from './TemperaturaFormClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function RegistroTemperaturaPage() {
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

  // Obtener equipos térmicos (CELDAS, VAPOR, HORNO)
  let query = supabase
    .from('equipos')
    .select('*, etapas_linea!inner(tipo, linea_id, nombre, lineas(nombre))')
    .in('etapas_linea.tipo', ['CELDAS', 'VAPOR', 'HORNO'])
    .order('codigo');

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    query = query.eq('etapas_linea.linea_id', profile.linea_id);
  }

  const { data: equiposData } = await query;
  const equipos = (equiposData || []) as any[];

  // Lotes activos opcionales
  const { data: lotesData } = await supabase
    .from('lotes')
    .select('id, codigo_lote')
    .eq('estado', 'EN_PROCESO');

  const lotes = (lotesData || []) as { id: string; codigo_lote: string }[];

  return (
    <div className="space-y-6">
      <TemperaturaFormClient equipos={equipos} lotes={lotes} />
    </div>
  );
}
