-- ==============================================================================
-- SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
-- Migración 003: Políticas de Seguridad Row Level Security (RLS)
-- Aislamiento estricto por Rol y Línea de Producción
-- ==============================================================================

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_linea ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE encargado_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avance_lote_etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_batidora ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_angulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_temperatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_merma ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_merma ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. TABLA: profiles
-- ------------------------------------------------------------------------------
-- Cada usuario lee su propio perfil. Supervisores y Gerencia leen todos para asignación y monitoreo.
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT USING (
  id = auth.uid() OR mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

-- Nadie puede modificar su propio rol o línea; solo Gerencia administra perfiles
CREATE POLICY profiles_update_policy ON profiles
FOR UPDATE USING (
  mi_rol() = 'GERENCIA'
);

CREATE POLICY profiles_insert_policy ON profiles
FOR INSERT WITH CHECK (
  mi_rol() = 'GERENCIA'
);

CREATE POLICY profiles_delete_policy ON profiles
FOR DELETE USING (
  mi_rol() = 'GERENCIA'
);

-- ------------------------------------------------------------------------------
-- 2. CATÁLOGOS Y CONFIGURACIÓN (Líneas, Etapas, Equipos, Productos, Recetas, etc.)
-- ------------------------------------------------------------------------------
-- Lectura pública para cualquier usuario autenticado en la planta
CREATE POLICY lineas_select ON lineas FOR SELECT TO authenticated USING (true);
CREATE POLICY lineas_mod ON lineas FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY etapas_select ON etapas_linea FOR SELECT TO authenticated USING (true);
CREATE POLICY etapas_mod ON etapas_linea FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY equipos_select ON equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY equipos_mod ON equipos FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY turnos_select ON turnos_config FOR SELECT TO authenticated USING (true);
CREATE POLICY turnos_mod ON turnos_config FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY productos_select ON productos FOR SELECT TO authenticated USING (true);
CREATE POLICY productos_mod ON productos FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY recetas_select ON recetas FOR SELECT TO authenticated USING (true);
CREATE POLICY recetas_mod ON recetas FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY motivos_merma_select ON motivos_merma FOR SELECT TO authenticated USING (true);
CREATE POLICY motivos_merma_mod ON motivos_merma FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY encargado_etapas_select ON encargado_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY encargado_etapas_mod ON encargado_etapas FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

CREATE POLICY supervisor_lineas_select ON supervisor_lineas FOR SELECT TO authenticated USING (true);
CREATE POLICY supervisor_lineas_mod ON supervisor_lineas FOR ALL TO authenticated USING (mi_rol() = 'GERENCIA');

-- ------------------------------------------------------------------------------
-- 3. ÓRDENES DE PRODUCCIÓN
-- ------------------------------------------------------------------------------
CREATE POLICY ordenes_select ON ordenes_produccion FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea(linea_id)
  OR (mi_rol() = 'ENCARGADO' AND linea_id = mi_linea())
);

CREATE POLICY ordenes_insert ON ordenes_produccion FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY ordenes_update ON ordenes_produccion FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY ordenes_delete ON ordenes_produccion FOR DELETE TO authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 4. LOTES Y AVANCES
-- ------------------------------------------------------------------------------
CREATE POLICY lotes_select ON lotes FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea((SELECT linea_id FROM ordenes_produccion WHERE id = orden_produccion_id))
  OR (mi_rol() = 'ENCARGADO' AND (SELECT linea_id FROM ordenes_produccion WHERE id = orden_produccion_id) = mi_linea())
);

CREATE POLICY lotes_insert ON lotes FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
);

CREATE POLICY lotes_update ON lotes FOR UPDATE TO authenticated USING (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
);

CREATE POLICY lotes_delete ON lotes FOR DELETE TO authenticated USING (false);

CREATE POLICY avance_select ON avance_lote_etapa FOR SELECT TO authenticated USING (true);
CREATE POLICY avance_insert ON avance_lote_etapa FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY avance_update ON avance_lote_etapa FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY avance_delete ON avance_lote_etapa FOR DELETE TO authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 5. REGISTROS OPERATIVOS (Batidora, Ángulo, Temperatura, Merma)
-- ------------------------------------------------------------------------------

-- 5.1. Batidora
CREATE POLICY batidora_select ON registros_batidora FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea((SELECT op.linea_id FROM lotes l JOIN ordenes_produccion op ON op.id = l.orden_produccion_id WHERE l.id = lote_id))
  OR (mi_rol() = 'ENCARGADO' AND (SELECT op.linea_id FROM lotes l JOIN ordenes_produccion op ON op.id = l.orden_produccion_id WHERE l.id = lote_id) = mi_linea())
);

CREATE POLICY batidora_insert ON registros_batidora FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
  AND (
    mi_rol() = 'GERENCIA'
    OR supervisa_linea((SELECT op.linea_id FROM lotes l JOIN ordenes_produccion op ON op.id = l.orden_produccion_id WHERE l.id = lote_id))
    OR (SELECT op.linea_id FROM lotes l JOIN ordenes_produccion op ON op.id = l.orden_produccion_id WHERE l.id = lote_id) = mi_linea()
  )
);

CREATE POLICY batidora_update ON registros_batidora FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY batidora_delete ON registros_batidora FOR DELETE TO authenticated USING (false);

-- 5.2. Ángulo
CREATE POLICY angulo_select ON registros_angulo FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea((SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id))
  OR (mi_rol() = 'ENCARGADO' AND (SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id) = mi_linea())
);

CREATE POLICY angulo_insert ON registros_angulo FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
  AND (
    mi_rol() = 'GERENCIA'
    OR supervisa_linea((SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id))
    OR (SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id) = mi_linea()
  )
);

CREATE POLICY angulo_update ON registros_angulo FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY angulo_delete ON registros_angulo FOR DELETE TO authenticated USING (false);

-- 5.3. Temperatura
CREATE POLICY temperatura_select ON registros_temperatura FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea((SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id))
  OR (mi_rol() = 'ENCARGADO' AND (SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id) = mi_linea())
);

CREATE POLICY temperatura_insert ON registros_temperatura FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
  AND (
    mi_rol() = 'GERENCIA'
    OR supervisa_linea((SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id))
    OR (SELECT el.linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = equipo_id) = mi_linea()
  )
);

CREATE POLICY temperatura_update ON registros_temperatura FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY temperatura_delete ON registros_temperatura FOR DELETE TO authenticated USING (false);

-- 5.4. Merma
CREATE POLICY merma_select ON registros_merma FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea(linea_id)
  OR (mi_rol() = 'ENCARGADO' AND linea_id = mi_linea())
);

CREATE POLICY merma_insert ON registros_merma FOR INSERT TO authenticated WITH CHECK (
  mi_rol() IN ('ENCARGADO', 'SUPERVISOR', 'GERENCIA')
  AND (
    mi_rol() IN ('SUPERVISOR', 'GERENCIA')
    OR (
      mi_rol() = 'ENCARGADO' 
      AND linea_id = mi_linea()
      AND EXISTS (
        SELECT 1 FROM encargado_etapas ee 
        JOIN etapas_linea el ON el.id = ee.etapa_id 
        WHERE ee.usuario_id = auth.uid() 
          AND el.linea_id = linea_id 
          AND el.tipo = 'EMPAQUETADO'
      )
    )
  )
);

CREATE POLICY merma_update ON registros_merma FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY merma_delete ON registros_merma FOR DELETE TO authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 6. ALERTAS (Lectura filtrada, reconocimiento por Supervisor/Gerencia)
-- ------------------------------------------------------------------------------
CREATE POLICY alertas_select ON alertas FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
  OR supervisa_linea(linea_id)
  OR (mi_rol() = 'ENCARGADO' AND linea_id = mi_linea())
);

CREATE POLICY alertas_insert ON alertas FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY alertas_update ON alertas FOR UPDATE TO authenticated USING (
  mi_rol() IN ('SUPERVISOR', 'GERENCIA')
);

CREATE POLICY alertas_delete ON alertas FOR DELETE TO authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 7. AUDITORÍA (Solo lectura para Gerencia, inmutable)
-- ------------------------------------------------------------------------------
CREATE POLICY auditoria_select ON auditoria FOR SELECT TO authenticated USING (
  mi_rol() = 'GERENCIA'
);

CREATE POLICY auditoria_insert ON auditoria FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY auditoria_update ON auditoria FOR UPDATE TO authenticated USING (false);
CREATE POLICY auditoria_delete ON auditoria FOR DELETE TO authenticated USING (false);
