-- ==============================================================================
-- SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
-- Migración 001: Esquema Inicial, Tablas, Constraints, Enums y Relaciones
-- Zona Horaria: America/Lima (UTC-5)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLA: lineas (3 líneas principales)
-- ------------------------------------------------------------------------------
CREATE TABLE lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL, -- 'PAN', 'BOLLERIA', 'PANQUELERIA'
  nombre text NOT NULL,
  limite_merma_turno_kg numeric(10,2) NOT NULL DEFAULT 50.00 CHECK (limite_merma_turno_kg > 0),
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: etapas_linea (8 etapas en orden secuencial estricto 1..8)
-- ------------------------------------------------------------------------------
CREATE TABLE etapas_linea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linea_id uuid NOT NULL REFERENCES lineas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN (
    'BATIDORA',
    'DIVISORA',
    'CELDAS',
    'VAPOR',
    'GUARNICIONES',
    'HORNO',
    'DESMOLDE',
    'EMPAQUETADO'
  )),
  orden int NOT NULL CHECK (orden BETWEEN 1 AND 8),
  activa boolean NOT NULL DEFAULT true,
  UNIQUE(linea_id, orden),
  UNIQUE(linea_id, tipo)
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: equipos (Asociados a etapas con umbrales físicos configurables)
-- ------------------------------------------------------------------------------
CREATE TABLE equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id uuid NOT NULL REFERENCES etapas_linea(id) ON DELETE CASCADE,
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  tipo_parametro text NOT NULL CHECK (tipo_parametro IN ('TIEMPO', 'ANGULO', 'TEMPERATURA', 'NINGUNO')),
  temp_min numeric(6,2) NULL,
  temp_max numeric(6,2) NULL,
  angulo_min numeric(5,2) NULL,
  angulo_max numeric(5,2) NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_rango_temperatura CHECK (temp_max IS NULL OR temp_min IS NULL OR temp_max >= temp_min),
  CONSTRAINT check_rango_angulo CHECK (angulo_max IS NULL OR angulo_min IS NULL OR angulo_max >= angulo_min)
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: profiles (Extensión de auth.users con roles)
-- ------------------------------------------------------------------------------
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')),
  linea_id uuid REFERENCES lineas(id) ON DELETE SET NULL, -- Asignada fija para ENCARGADO
  supervisa_todas boolean NOT NULL DEFAULT false,        -- Para Supervisores de toda la planta
  turno_habitual text NOT NULL DEFAULT 'MANANA' CHECK (turno_habitual IN ('MANANA', 'TARDE', 'NOCHE')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: encargado_etapas (Relación muchos a muchos: Encargado -> Etapas)
-- ------------------------------------------------------------------------------
CREATE TABLE encargado_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa_id uuid NOT NULL REFERENCES etapas_linea(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, etapa_id)
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: supervisor_lineas (Líneas asignadas a Supervisores)
-- ------------------------------------------------------------------------------
CREATE TABLE supervisor_lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linea_id uuid NOT NULL REFERENCES lineas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, linea_id)
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: turnos_config (Configuración de horarios de planta)
-- ------------------------------------------------------------------------------
CREATE TABLE turnos_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL CHECK (codigo IN ('MANANA', 'TARDE', 'NOCHE')),
  nombre text NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  cruza_medianoche boolean NOT NULL DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: productos (Catálogo por línea)
-- ------------------------------------------------------------------------------
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linea_id uuid NOT NULL REFERENCES lineas(id) ON DELETE RESTRICT,
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  peso_unitario_g numeric(8,2) NOT NULL CHECK (peso_unitario_g > 0),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: recetas (Parámetros de batido y rendimiento por producto)
-- ------------------------------------------------------------------------------
CREATE TABLE recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  tiempo_objetivo_seg int NOT NULL CHECK (tiempo_objetivo_seg > 0),
  tolerancia_pct numeric(4,2) NOT NULL DEFAULT 5.00 CHECK (tolerancia_pct >= 0 AND tolerancia_pct <= 50),
  piezas_por_receta int NOT NULL CHECK (piezas_por_receta > 0),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. TABLA: ordenes_produccion (Con columna generada nativa restante_recetas)
-- ------------------------------------------------------------------------------
CREATE TABLE ordenes_produccion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_orden text UNIQUE NOT NULL,
  linea_id uuid NOT NULL REFERENCES lineas(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  receta_id uuid NOT NULL REFERENCES recetas(id),
  turno text NOT NULL CHECK (turno IN ('MANANA', 'TARDE', 'NOCHE')),
  fecha date NOT NULL DEFAULT current_date,
  total_planificado_recetas int NOT NULL CHECK (total_planificado_recetas > 0),
  producido_recetas int NOT NULL DEFAULT 0 CHECK (producido_recetas >= 0),
  -- Columna GENERADA nativa STORED (Incorruptible)
  restante_recetas int GENERATED ALWAYS AS (total_planificado_recetas - producido_recetas) STORED,
  porcentaje_alerta_restante numeric(4,2) NOT NULL DEFAULT 10.00 CHECK (porcentaje_alerta_restante >= 0 AND porcentaje_alerta_restante <= 100),
  estado text NOT NULL DEFAULT 'EN_PROCESO' CHECK (estado IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_producido_no_excede_planificado CHECK (producido_recetas <= total_planificado_recetas)
);

-- ------------------------------------------------------------------------------
-- 11. TABLA: lotes
-- ------------------------------------------------------------------------------
CREATE TABLE lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_lote text UNIQUE NOT NULL,
  orden_produccion_id uuid NOT NULL REFERENCES ordenes_produccion(id) ON DELETE RESTRICT,
  etapa_actual_id uuid NOT NULL REFERENCES etapas_linea(id),
  estado text NOT NULL DEFAULT 'EN_PROCESO' CHECK (estado IN ('EN_PROCESO', 'COMPLETADO', 'RECHAZADO')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 12. TABLA: avance_lote_etapa (Trazabilidad temporal por etapa)
-- ------------------------------------------------------------------------------
CREATE TABLE avance_lote_etapa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  etapa_id uuid NOT NULL REFERENCES etapas_linea(id),
  fecha_hora_ingreso timestamptz NOT NULL DEFAULT now(),
  fecha_hora_salida timestamptz NULL,
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  observaciones text NULL
);

-- ------------------------------------------------------------------------------
-- 13. TABLA: registros_batidora (Etapa 1)
-- ------------------------------------------------------------------------------
CREATE TABLE registros_batidora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  receta_id uuid NOT NULL REFERENCES recetas(id),
  tiempo_batido_seg int NOT NULL CHECK (tiempo_batido_seg > 0),
  tiempo_objetivo_seg int NOT NULL,
  tolerancia_pct numeric(4,2) NOT NULL,
  dentro_tolerancia boolean NOT NULL,
  turno text NOT NULL CHECK (turno IN ('MANANA', 'TARDE', 'NOCHE')),
  fecha_turno date NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  anulado boolean NOT NULL DEFAULT false,
  motivo_anulacion text NULL,
  anulado_por uuid REFERENCES profiles(id) NULL,
  anulado_at timestamptz NULL
);

-- ------------------------------------------------------------------------------
-- 14. TABLA: registros_angulo (Etapa 2 - Divisora)
-- ------------------------------------------------------------------------------
CREATE TABLE registros_angulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL,
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  angulo_grados numeric(5,2) NOT NULL CHECK (angulo_grados >= 0 AND angulo_grados <= 360),
  dentro_rango boolean NOT NULL,
  turno text NOT NULL CHECK (turno IN ('MANANA', 'TARDE', 'NOCHE')),
  fecha_turno date NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  anulado boolean NOT NULL DEFAULT false,
  motivo_anulacion text NULL,
  anulado_por uuid REFERENCES profiles(id) NULL,
  anulado_at timestamptz NULL
);

-- ------------------------------------------------------------------------------
-- 15. TABLA: registros_temperatura (Etapas 3, 4, 6 - Celdas, Vapor, Horno)
-- ------------------------------------------------------------------------------
CREATE TABLE registros_temperatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL,
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  temperatura_c numeric(6,2) NOT NULL CHECK (temperatura_c BETWEEN -20 AND 350),
  dentro_rango boolean NOT NULL,
  turno text NOT NULL CHECK (turno IN ('MANANA', 'TARDE', 'NOCHE')),
  fecha_turno date NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  anulado boolean NOT NULL DEFAULT false,
  motivo_anulacion text NULL,
  anulado_por uuid REFERENCES profiles(id) NULL,
  anulado_at timestamptz NULL
);

-- ------------------------------------------------------------------------------
-- 16. TABLA: motivos_merma (Catálogo configurable)
-- ------------------------------------------------------------------------------
CREATE TABLE motivos_merma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 17. TABLA: registros_merma (SOLO en Etapa 8 - Empaquetado / Calidad)
-- ------------------------------------------------------------------------------
CREATE TABLE registros_merma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linea_id uuid NOT NULL REFERENCES lineas(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL,
  peso_kg numeric(10,3) NOT NULL CHECK (peso_kg > 0),
  motivo_id uuid REFERENCES motivos_merma(id) ON DELETE SET NULL,
  turno text NOT NULL CHECK (turno IN ('MANANA', 'TARDE', 'NOCHE')),
  fecha_turno date NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  observaciones text NULL,
  anulado boolean NOT NULL DEFAULT false,
  motivo_anulacion text NULL,
  anulado_por uuid REFERENCES profiles(id) NULL,
  anulado_at timestamptz NULL
);

-- ------------------------------------------------------------------------------
-- 18. TABLA: alertas (Alertas visuales en tiempo real)
-- ------------------------------------------------------------------------------
CREATE TABLE alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN (
    'TEMPERATURA_FUERA_RANGO',
    'ANGULO_FUERA_RANGO',
    'TIEMPO_BATIDO_FUERA_TOLERANCIA',
    'ORDEN_PORCENTAJE_CRITICO',
    'LIMITE_MERMA_SUPERADO'
  )),
  severidad text NOT NULL CHECK (severidad IN ('ADVERTENCIA', 'CRITICA')),
  linea_id uuid NOT NULL REFERENCES lineas(id),
  equipo_id uuid REFERENCES equipos(id),
  lote_id uuid REFERENCES lotes(id),
  orden_id uuid REFERENCES ordenes_produccion(id),
  mensaje text NOT NULL,
  valor_registrado text NOT NULL,
  valor_esperado text NOT NULL,
  estado text NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'RECONOCIDA', 'CERRADA')),
  reconocida_por uuid REFERENCES profiles(id) NULL,
  reconocida_at timestamptz NULL,
  comentario_reconocimiento text NULL,
  cerrada_por uuid REFERENCES profiles(id) NULL,
  cerrada_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 19. TABLA: auditoria (Bitácora inmutable de modificaciones operativas)
-- ------------------------------------------------------------------------------
CREATE TABLE auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  registro_id uuid NOT NULL,
  accion text NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'ANULACION', 'ESTADO_CAMBIO')),
  usuario_id uuid REFERENCES profiles(id) NULL,
  datos_anteriores jsonb NULL,
  datos_nuevos jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO PARA TIEMPO REAL Y CONSULTAS DE TURNO
-- ------------------------------------------------------------------------------
CREATE INDEX idx_profiles_rol ON profiles(rol);
CREATE INDEX idx_profiles_linea ON profiles(linea_id);
CREATE INDEX idx_etapas_linea_orden ON etapas_linea(linea_id, orden);
CREATE INDEX idx_equipos_etapa ON equipos(etapa_id);
CREATE INDEX idx_lotes_etapa_actual ON lotes(etapa_actual_id);
CREATE INDEX idx_lotes_orden ON lotes(orden_produccion_id);
CREATE INDEX idx_avance_lote_lote ON avance_lote_etapa(lote_id);
CREATE INDEX idx_alertas_linea_estado ON alertas(linea_id, estado);
CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_merma_linea_turno_fecha ON registros_merma(linea_id, fecha_turno, turno);
CREATE INDEX idx_temperatura_equipo_fecha ON registros_temperatura(equipo_id, fecha_hora DESC);
CREATE INDEX idx_batidora_lote ON registros_batidora(lote_id);
