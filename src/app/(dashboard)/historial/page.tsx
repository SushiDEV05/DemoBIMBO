import React from 'react';
import { createClient } from '@/lib/supabase/server';
import HistorialClient from './HistorialClient';
import { Database } from '@/lib/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function HistorialPage() {
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

  // 1. Obtener registros de batidora
  let batidoraQuery = supabase
    .from('registros_batidora')
    .select('*, lotes(codigo_lote), equipos(nombre, codigo), recetas(nombre), profiles!registros_batidora_usuario_id_fkey(nombre_completo)')
    .order('fecha_hora', { ascending: false })
    .limit(50);

  // 2. Obtener registros de ángulo
  let anguloQuery = supabase
    .from('registros_angulo')
    .select('*, lotes(codigo_lote), equipos(nombre, codigo), profiles!registros_angulo_usuario_id_fkey(nombre_completo)')
    .order('fecha_hora', { ascending: false })
    .limit(50);

  // 3. Obtener registros de temperatura
  let tempQuery = supabase
    .from('registros_temperatura')
    .select('*, lotes(codigo_lote), equipos(nombre, codigo), profiles!registros_temperatura_usuario_id_fkey(nombre_completo)')
    .order('fecha_hora', { ascending: false })
    .limit(50);

  const [
    { data: batidoraData },
    { data: anguloData },
    { data: tempData },
  ] = await Promise.all([batidoraQuery, anguloQuery, tempQuery]);

  // Unificar registros en una lista uniforme
  const registrosUnificados = [
    ...(batidoraData || []).map((b: any) => ({
      id: b.id,
      tabla: 'registros_batidora',
      tipo: 'BATIDORA',
      equipo_codigo: b.equipos?.codigo,
      equipo_nombre: b.equipos?.nombre,
      lote_codigo: b.lotes?.codigo_lote,
      valor_registrado: `${b.tiempo_batido_seg} seg (${Math.floor(b.tiempo_batido_seg / 60)}m ${b.tiempo_batido_seg % 60}s)`,
      valor_esperado: `${b.tiempo_objetivo_seg}s ±${b.tolerancia_pct}%`,
      dentro_rango: b.dentro_tolerancia,
      turno: b.turno,
      fecha_turno: b.fecha_turno,
      fecha_hora: b.fecha_hora,
      usuario_nombre: b.profiles?.nombre_completo,
      anulado: b.anulado,
      motivo_anulacion: b.motivo_anulacion,
      anulado_at: b.anulado_at,
    })),
    ...(anguloData || []).map((a: any) => ({
      id: a.id,
      tabla: 'registros_angulo',
      tipo: 'ANGULO',
      equipo_codigo: a.equipos?.codigo,
      equipo_nombre: a.equipos?.nombre,
      lote_codigo: a.lotes?.codigo_lote || 'N/A',
      valor_registrado: `${a.angulo_grados}°`,
      valor_esperado: 'Rango Divisora',
      dentro_rango: a.dentro_rango,
      turno: a.turno,
      fecha_turno: a.fecha_turno,
      fecha_hora: a.fecha_hora,
      usuario_nombre: a.profiles?.nombre_completo,
      anulado: a.anulado,
      motivo_anulacion: a.motivo_anulacion,
      anulado_at: a.anulado_at,
    })),
    ...(tempData || []).map((t: any) => ({
      id: t.id,
      tabla: 'registros_temperatura',
      tipo: 'TEMPERATURA',
      equipo_codigo: t.equipos?.codigo,
      equipo_nombre: t.equipos?.nombre,
      lote_codigo: t.lotes?.codigo_lote || 'N/A',
      valor_registrado: `${t.temperatura_c}°C`,
      valor_esperado: 'Rango Térmico',
      dentro_rango: t.dentro_rango,
      turno: t.turno,
      fecha_turno: t.fecha_turno,
      fecha_hora: t.fecha_hora,
      usuario_nombre: t.profiles?.nombre_completo,
      anulado: t.anulado,
      motivo_anulacion: t.motivo_anulacion,
      anulado_at: t.anulado_at,
    })),
  ].sort((x, y) => new Date(y.fecha_hora).getTime() - new Date(x.fecha_hora).getTime());

  return (
    <div className="space-y-6">
      <HistorialClient
        registros={registrosUnificados}
        userProfile={profile}
      />
    </div>
  );
}
