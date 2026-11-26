export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = 'ENCARGADO' | 'SUPERVISOR' | 'GERENCIA';
export type TurnoCodigo = 'MANANA' | 'TARDE' | 'NOCHE';
export type TipoEtapa =
  | 'BATIDORA'
  | 'DIVISORA'
  | 'CELDAS'
  | 'VAPOR'
  | 'GUARNICIONES'
  | 'HORNO'
  | 'DESMOLDE'
  | 'EMPAQUETADO';

export type TipoAlerta =
  | 'TEMPERATURA_FUERA_RANGO'
  | 'ANGULO_FUERA_RANGO'
  | 'TIEMPO_BATIDO_FUERA_TOLERANCIA'
  | 'ORDEN_PORCENTAJE_CRITICO'
  | 'LIMITE_MERMA_SUPERADO';

export type SeveridadAlerta = 'ADVERTENCIA' | 'CRITICA';
export type EstadoAlerta = 'ACTIVA' | 'RECONOCIDA' | 'CERRADA';
export type EstadoOrden = 'PROGRAMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
export type EstadoLote = 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';

export interface Database {
  public: {
    Tables: {
      lineas: {
        Row: {
          id: string;
          codigo: string;
          nombre: string;
          limite_merma_turno_kg: number;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          nombre: string;
          limite_merma_turno_kg?: number;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          nombre?: string;
          limite_merma_turno_kg?: number;
          activa?: boolean;
          created_at?: string;
        };
      };
      etapas_linea: {
        Row: {
          id: string;
          linea_id: string;
          nombre: string;
          tipo: TipoEtapa;
          orden: number;
          activa: boolean;
        };
        Insert: {
          id?: string;
          linea_id: string;
          nombre: string;
          tipo: TipoEtapa;
          orden: number;
          activa?: boolean;
        };
        Update: {
          id?: string;
          linea_id?: string;
          nombre?: string;
          tipo?: TipoEtapa;
          orden?: number;
          activa?: boolean;
        };
      };
      equipos: {
        Row: {
          id: string;
          etapa_id: string;
          codigo: string;
          nombre: string;
          tipo_parametro: 'TIEMPO' | 'ANGULO' | 'TEMPERATURA' | 'NINGUNO';
          temp_min: number | null;
          temp_max: number | null;
          angulo_min: number | null;
          angulo_max: number | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          etapa_id: string;
          codigo: string;
          nombre: string;
          tipo_parametro: 'TIEMPO' | 'ANGULO' | 'TEMPERATURA' | 'NINGUNO';
          temp_min?: number | null;
          temp_max?: number | null;
          angulo_min?: number | null;
          angulo_max?: number | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          etapa_id?: string;
          codigo?: string;
          nombre?: string;
          tipo_parametro?: 'TIEMPO' | 'ANGULO' | 'TEMPERATURA' | 'NINGUNO';
          temp_min?: number | null;
          temp_max?: number | null;
          angulo_min?: number | null;
          angulo_max?: number | null;
          activo?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          nombre_completo: string;
          rol: RolUsuario;
          linea_id: string | null;
          supervisa_todas: boolean;
          turno_habitual: TurnoCodigo;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre_completo: string;
          rol: RolUsuario;
          linea_id?: string | null;
          supervisa_todas?: boolean;
          turno_habitual?: TurnoCodigo;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre_completo?: string;
          rol?: RolUsuario;
          linea_id?: string | null;
          supervisa_todas?: boolean;
          turno_habitual?: TurnoCodigo;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      encargado_etapas: {
        Row: {
          id: string;
          usuario_id: string;
          etapa_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          etapa_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          etapa_id?: string;
          created_at?: string;
        };
      };
      supervisor_lineas: {
        Row: {
          id: string;
          usuario_id: string;
          linea_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          linea_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          linea_id?: string;
          created_at?: string;
        };
      };
      turnos_config: {
        Row: {
          id: string;
          codigo: TurnoCodigo;
          nombre: string;
          hora_inicio: string;
          hora_fin: string;
          cruza_medianoche: boolean;
        };
        Insert: {
          id?: string;
          codigo: TurnoCodigo;
          nombre: string;
          hora_inicio: string;
          hora_fin: string;
          cruza_medianoche?: boolean;
        };
        Update: {
          id?: string;
          codigo?: TurnoCodigo;
          nombre?: string;
          hora_inicio?: string;
          hora_fin?: string;
          cruza_medianoche?: boolean;
        };
      };
      productos: {
        Row: {
          id: string;
          linea_id: string;
          codigo: string;
          nombre: string;
          peso_unitario_g: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          linea_id: string;
          codigo: string;
          nombre: string;
          peso_unitario_g: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          linea_id?: string;
          codigo?: string;
          nombre?: string;
          peso_unitario_g?: number;
          activo?: boolean;
          created_at?: string;
        };
      };
      recetas: {
        Row: {
          id: string;
          producto_id: string;
          codigo: string;
          nombre: string;
          tiempo_objetivo_seg: number;
          tolerancia_pct: number;
          piezas_por_receta: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          producto_id: string;
          codigo: string;
          nombre: string;
          tiempo_objetivo_seg: number;
          tolerancia_pct?: number;
          piezas_por_receta: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          producto_id?: string;
          codigo?: string;
          nombre?: string;
          tiempo_objetivo_seg?: number;
          tolerancia_pct?: number;
          piezas_por_receta?: number;
          activo?: boolean;
          created_at?: string;
        };
      };
      ordenes_produccion: {
        Row: {
          id: string;
          codigo_orden: string;
          linea_id: string;
          producto_id: string;
          receta_id: string;
          turno: TurnoCodigo;
          fecha: string;
          total_planificado_recetas: number;
          producido_recetas: number;
          restante_recetas: number;
          porcentaje_alerta_restante: number;
          estado: EstadoOrden;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo_orden: string;
          linea_id: string;
          producto_id: string;
          receta_id: string;
          turno: TurnoCodigo;
          fecha?: string;
          total_planificado_recetas: number;
          producido_recetas?: number;
          porcentaje_alerta_restante?: number;
          estado?: EstadoOrden;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          codigo_orden?: string;
          linea_id?: string;
          producto_id?: string;
          receta_id?: string;
          turno?: TurnoCodigo;
          fecha?: string;
          total_planificado_recetas?: number;
          producido_recetas?: number;
          porcentaje_alerta_restante?: number;
          estado?: EstadoOrden;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lotes: {
        Row: {
          id: string;
          codigo_lote: string;
          orden_produccion_id: string;
          etapa_actual_id: string;
          estado: EstadoLote;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo_lote: string;
          orden_produccion_id: string;
          etapa_actual_id: string;
          estado?: EstadoLote;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          codigo_lote?: string;
          orden_produccion_id?: string;
          etapa_actual_id?: string;
          estado?: EstadoLote;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      avance_lote_etapa: {
        Row: {
          id: string;
          lote_id: string;
          etapa_id: string;
          fecha_hora_ingreso: string;
          fecha_hora_salida: string | null;
          usuario_id: string;
          observaciones: string | null;
        };
        Insert: {
          id?: string;
          lote_id: string;
          etapa_id: string;
          fecha_hora_ingreso?: string;
          fecha_hora_salida?: string | null;
          usuario_id: string;
          observaciones?: string | null;
        };
        Update: {
          id?: string;
          lote_id?: string;
          etapa_id?: string;
          fecha_hora_ingreso?: string;
          fecha_hora_salida?: string | null;
          usuario_id?: string;
          observaciones?: string | null;
        };
      };
      registros_batidora: {
        Row: {
          id: string;
          lote_id: string;
          equipo_id: string;
          receta_id: string;
          tiempo_batido_seg: number;
          tiempo_objetivo_seg: number;
          tolerancia_pct: number;
          dentro_tolerancia: boolean;
          turno: TurnoCodigo;
          fecha_turno: string;
          fecha_hora: string;
          usuario_id: string;
          anulado: boolean;
          motivo_anulacion: string | null;
          anulado_por: string | null;
          anulado_at: string | null;
        };
        Insert: {
          id?: string;
          lote_id: string;
          equipo_id: string;
          receta_id: string;
          tiempo_batido_seg: number;
          tiempo_objetivo_seg?: number;
          tolerancia_pct?: number;
          dentro_tolerancia?: boolean;
          turno?: TurnoCodigo;
          fecha_turno?: string;
          fecha_hora?: string;
          usuario_id: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
        Update: {
          id?: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
      };
      registros_angulo: {
        Row: {
          id: string;
          lote_id: string | null;
          equipo_id: string;
          angulo_grados: number;
          dentro_rango: boolean;
          turno: TurnoCodigo;
          fecha_turno: string;
          fecha_hora: string;
          usuario_id: string;
          anulado: boolean;
          motivo_anulacion: string | null;
          anulado_por: string | null;
          anulado_at: string | null;
        };
        Insert: {
          id?: string;
          lote_id?: string | null;
          equipo_id: string;
          angulo_grados: number;
          dentro_rango?: boolean;
          turno?: TurnoCodigo;
          fecha_turno?: string;
          fecha_hora?: string;
          usuario_id: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
        Update: {
          id?: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
      };
      registros_temperatura: {
        Row: {
          id: string;
          lote_id: string | null;
          equipo_id: string;
          temperatura_c: number;
          dentro_rango: boolean;
          turno: TurnoCodigo;
          fecha_turno: string;
          fecha_hora: string;
          usuario_id: string;
          anulado: boolean;
          motivo_anulacion: string | null;
          anulado_por: string | null;
          anulado_at: string | null;
        };
        Insert: {
          id?: string;
          lote_id?: string | null;
          equipo_id: string;
          temperatura_c: number;
          dentro_rango?: boolean;
          turno?: TurnoCodigo;
          fecha_turno?: string;
          fecha_hora?: string;
          usuario_id: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
        Update: {
          id?: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
      };
      motivos_merma: {
        Row: {
          id: string;
          codigo: string;
          nombre: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          nombre: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          nombre?: string;
          activo?: boolean;
          created_at?: string;
        };
      };
      registros_merma: {
        Row: {
          id: string;
          linea_id: string;
          producto_id: string;
          lote_id: string | null;
          peso_kg: number;
          motivo_id: string | null;
          turno: TurnoCodigo;
          fecha_turno: string;
          fecha_hora: string;
          usuario_id: string;
          observaciones: string | null;
          anulado: boolean;
          motivo_anulacion: string | null;
          anulado_por: string | null;
          anulado_at: string | null;
        };
        Insert: {
          id?: string;
          linea_id: string;
          producto_id: string;
          lote_id?: string | null;
          peso_kg: number;
          motivo_id?: string | null;
          turno?: TurnoCodigo;
          fecha_turno?: string;
          fecha_hora?: string;
          usuario_id: string;
          observaciones?: string | null;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
        Update: {
          id?: string;
          anulado?: boolean;
          motivo_anulacion?: string | null;
          anulado_por?: string | null;
          anulado_at?: string | null;
        };
      };
      alertas: {
        Row: {
          id: string;
          tipo: TipoAlerta;
          severidad: SeveridadAlerta;
          linea_id: string;
          equipo_id: string | null;
          lote_id: string | null;
          orden_id: string | null;
          mensaje: string;
          valor_registrado: string;
          valor_esperado: string;
          estado: EstadoAlerta;
          reconocida_por: string | null;
          reconocida_at: string | null;
          comentario_reconocimiento: string | null;
          cerrada_por: string | null;
          cerrada_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: TipoAlerta;
          severidad: SeveridadAlerta;
          linea_id: string;
          equipo_id?: string | null;
          lote_id?: string | null;
          orden_id?: string | null;
          mensaje: string;
          valor_registrado: string;
          valor_esperado: string;
          estado?: EstadoAlerta;
          reconocida_por?: string | null;
          reconocida_at?: string | null;
          comentario_reconocimiento?: string | null;
          cerrada_por?: string | null;
          cerrada_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          estado?: EstadoAlerta;
          reconocida_por?: string | null;
          reconocida_at?: string | null;
          comentario_reconocimiento?: string | null;
          cerrada_por?: string | null;
          cerrada_at?: string | null;
        };
      };
      auditoria: {
        Row: {
          id: string;
          tabla: string;
          registro_id: string;
          accion: 'INSERT' | 'UPDATE' | 'ANULACION' | 'ESTADO_CAMBIO';
          usuario_id: string | null;
          datos_anteriores: Json | null;
          datos_nuevos: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tabla: string;
          registro_id: string;
          accion: 'INSERT' | 'UPDATE' | 'ANULACION' | 'ESTADO_CAMBIO';
          usuario_id?: string | null;
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
        };
      };
    };
    Functions: {
      mi_rol: {
        Args: Record<PropertyKey, never>;
        Returns: RolUsuario;
      };
      mi_linea: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      supervisa_linea: {
        Args: { p_linea_id: string };
        Returns: boolean;
      };
      obtener_turno_y_fecha: {
        Args: { p_timestamp?: string };
        Returns: { turno: TurnoCodigo; fecha_turno: string }[];
      };
      anular_registro: {
        Args: { p_tabla: string; p_id: string; p_motivo: string };
        Returns: void;
      };
      crear_lote_con_batida: {
        Args: {
          p_orden_id: string;
          p_codigo_lote: string;
          p_equipo_batidora_id: string;
          p_tiempo_batido_seg: number;
          p_observaciones?: string | null;
        };
        Returns: string;
      };
      avanzar_lote: {
        Args: {
          p_lote_id: string;
          p_etapa_destino_id: string;
          p_observaciones?: string | null;
        };
        Returns: void;
      };
    };
  };
}
