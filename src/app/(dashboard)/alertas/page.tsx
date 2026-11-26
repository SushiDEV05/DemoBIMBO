import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AlertasClient from './AlertasClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type LineaRow = Database['public']['Tables']['lineas']['Row'];

export default async function AlertasPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, lineas(*)')
    .eq('id', user?.id || '')
    .single();

  const profile = profileData as (ProfileRow & { lineas: LineaRow | null }) | null;

  // Obtener alertas con detalles de equipos y líneas
  let query = supabase
    .from('alertas')
    .select('*, lineas(nombre, codigo), equipos(nombre, codigo), profiles!alertas_reconocida_por_fkey(nombre_completo)')
    .order('created_at', { ascending: false });

  if (profile?.rol === 'ENCARGADO' && profile.linea_id) {
    query = query.eq('linea_id', profile.linea_id);
  }

  const { data: alertasData } = await query;
  const alertas = (alertasData || []) as any[];

  // Obtener las 3 líneas para los filtros
  const { data: lineasData } = await supabase
    .from('lineas')
    .select('*')
    .order('codigo');

  const lineas = (lineasData || []) as LineaRow[];

  return (
    <div className="space-y-6">
      <AlertasClient
        initialAlertas={alertas}
        lineas={lineas}
        userProfile={profile}
      />
    </div>
  );
}
