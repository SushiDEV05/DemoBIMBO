import React from 'react';
import { createClient } from '@/lib/supabase/server';
import FlujoLineaClient from './FlujoLineaClient';
import { Database } from '@/lib/types/database.types';

type LineaRow = Database['public']['Tables']['lineas']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function FlujoPage({
  searchParams,
}: {
  searchParams?: { linea?: string };
}) {
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

  // Obtener las 3 líneas
  const { data: lineasData } = await supabase
    .from('lineas')
    .select('*')
    .order('codigo');

  const lineas = (lineasData || []) as LineaRow[];

  // Determinar línea activa
  const defaultCodigo = profile?.lineas?.codigo || 'PAN';
  const activeCodigo = searchParams?.linea || defaultCodigo;
  const activeLinea = lineas.find((l) => l.codigo === activeCodigo) || lineas[0];

  // Obtener las 8 etapas de la línea activa en orden secuencial
  const { data: etapasData } = await supabase
    .from('etapas_linea')
    .select('*, equipos(*)')
    .eq('linea_id', activeLinea.id)
    .order('orden', { ascending: true });

  const etapas = (etapasData || []) as any[];

  // Obtener lotes en proceso de esta línea
  const { data: lotesData } = await supabase
    .from('lotes')
    .select('*, etapas_linea!inner(linea_id, orden, nombre), ordenes_produccion(*, productos(*)), avance_lote_etapa(*)')
    .eq('etapas_linea.linea_id', activeLinea.id)
    .eq('estado', 'EN_PROCESO')
    .order('created_at', { ascending: true });

  const lotes = (lotesData || []) as any[];

  // Obtener alertas activas de la línea para semaforizar etapas
  const { data: alertasData } = await supabase
    .from('alertas')
    .select('*')
    .eq('linea_id', activeLinea.id)
    .eq('estado', 'ACTIVA');

  const alertas = (alertasData || []) as any[];

  return (
    <div className="space-y-6">
      <FlujoLineaClient
        lineas={lineas}
        activeLinea={activeLinea}
        etapas={etapas}
        lotes={lotes}
        alertas={alertas}
        userProfile={profile}
      />
    </div>
  );
}
