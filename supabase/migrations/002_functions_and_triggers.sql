-- ==============================================================================
-- SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
-- Migración 002: Funciones Transaccionales, Triggers y RPCs
-- Todo con SECURITY DEFINER y search_path = public, pg_temp
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIONES AUXILIARES PARA POLÍTICAS RLS (Sin recursión sobre profiles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mi_rol() RETURNS text
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION mi_linea() RETURNS uuid
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT linea_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION mis_etapas() RETURNS SETOF uuid
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT etapa_id FROM encargado_etapas WHERE usuario_id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION supervisa_linea(p_linea_id uuid) RETURNS boolean
SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
      AND (
        p.rol = 'GERENCIA' 
        OR (p.rol = 'SUPERVISOR' AND (p.supervisa_todas = true OR EXISTS (
          SELECT 1 FROM supervisor_lineas sl WHERE sl.usuario_id = p.id AND sl.linea_id = p_linea_id
        )))
      )
  );
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------------------------
-- 2. CÁLCULO DE TURNO Y JORNADA OPERATIVA (Soporta cruce de medianoche en Lima)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION obtener_turno_y_fecha(p_timestamp timestamptz DEFAULT now())
RETURNS TABLE(turno text, fecha_turno date) 
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_local_ts timestamp;
  v_hora time;
  v_fecha date;
  v_cfg turnos_config%ROWTYPE;
BEGIN
  v_local_ts := p_timestamp AT TIME ZONE 'America/Lima';
  v_hora := v_local_ts::time;
  v_fecha := v_local_ts::date;

  -- Intentar buscar en tabla turnos_config
  FOR v_cfg IN SELECT * FROM turnos_config LOOP
    IF v_cfg.cruza_medianoche THEN
      IF v_hora >= v_cfg.hora_inicio OR v_hora < v_cfg.hora_fin THEN
        turno := v_cfg.codigo;
        IF v_hora < v_cfg.hora_fin THEN
          fecha_turno := v_fecha - 1;
        ELSE
          fecha_turno := v_fecha;
        END IF;
        RETURN NEXT;
        RETURN;
      END IF;
    ELSE
      IF v_hora >= v_cfg.hora_inicio AND v_hora < v_cfg.hora_fin THEN
        turno := v_cfg.codigo;
        fecha_turno := v_fecha;
        RETURN NEXT;
        RETURN;
      END IF;
    END IF;
  END LOOP;

  -- Lógica por defecto (06-14 Mañana, 14-22 Tarde, 22-06 Noche)
  IF v_hora >= '06:00:00' AND v_hora < '14:00:00' THEN
    turno := 'MANANA';
    fecha_turno := v_fecha;
  ELSIF v_hora >= '14:00:00' AND v_hora < '22:00:00' THEN
    turno := 'TARDE';
    fecha_turno := v_fecha;
  ELSE
    turno := 'NOCHE';
    IF v_hora < '06:00:00' THEN
      fecha_turno := v_fecha - 1;
    ELSE
      fecha_turno := v_fecha;
    END IF;
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- 3. TRIGGERS BEFORE INSERT: Cálculo forzado de tolerancias y turnos en servidor
-- ------------------------------------------------------------------------------

-- 3.1. Batidora
CREATE OR REPLACE FUNCTION trg_batidora_before_insert() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_rec recetas%ROWTYPE;
  v_min numeric;
  v_max numeric;
  v_tf RECORD;
BEGIN
  SELECT * INTO v_rec FROM recetas WHERE id = NEW.receta_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receta indicada no existe en la base de datos.';
  END IF;

  NEW.tiempo_objetivo_seg := v_rec.tiempo_objetivo_seg;
  NEW.tolerancia_pct := v_rec.tolerancia_pct;
  v_min := v_rec.tiempo_objetivo_seg * (1 - (v_rec.tolerancia_pct / 100.0));
  v_max := v_rec.tiempo_objetivo_seg * (1 + (v_rec.tolerancia_pct / 100.0));
  NEW.dentro_tolerancia := (NEW.tiempo_batido_seg >= v_min AND NEW.tiempo_batido_seg <= v_max);

  SELECT turno, fecha_turno INTO v_tf FROM obtener_turno_y_fecha(NEW.fecha_hora);
  NEW.turno := v_tf.turno;
  NEW.fecha_turno := v_tf.fecha_turno;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batidora_before_insert_exec
BEFORE INSERT ON registros_batidora
FOR EACH ROW EXECUTE FUNCTION trg_batidora_before_insert();

-- 3.2. Divisora (Ángulo)
CREATE OR REPLACE FUNCTION trg_angulo_before_insert() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_eq equipos%ROWTYPE;
  v_tf RECORD;
BEGIN
  SELECT * INTO v_eq FROM equipos WHERE id = NEW.equipo_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipo divisora no encontrado.';
  END IF;

  IF v_eq.angulo_min IS NOT NULL AND v_eq.angulo_max IS NOT NULL THEN
    NEW.dentro_rango := (NEW.angulo_grados >= v_eq.angulo_min AND NEW.angulo_grados <= v_eq.angulo_max);
  ELSE
    NEW.dentro_rango := true;
  END IF;

  SELECT turno, fecha_turno INTO v_tf FROM obtener_turno_y_fecha(NEW.fecha_hora);
  NEW.turno := v_tf.turno;
  NEW.fecha_turno := v_tf.fecha_turno;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_angulo_before_insert_exec
BEFORE INSERT ON registros_angulo
FOR EACH ROW EXECUTE FUNCTION trg_angulo_before_insert();

-- 3.3. Temperaturas
CREATE OR REPLACE FUNCTION trg_temperatura_before_insert() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_eq equipos%ROWTYPE;
  v_tf RECORD;
BEGIN
  SELECT * INTO v_eq FROM equipos WHERE id = NEW.equipo_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipo térmico no encontrado.';
  END IF;

  IF v_eq.temp_min IS NOT NULL AND v_eq.temp_max IS NOT NULL THEN
    NEW.dentro_rango := (NEW.temperatura_c >= v_eq.temp_min AND NEW.temperatura_c <= v_eq.temp_max);
  ELSE
    NEW.dentro_rango := true;
  END IF;

  SELECT turno, fecha_turno INTO v_tf FROM obtener_turno_y_fecha(NEW.fecha_hora);
  NEW.turno := v_tf.turno;
  NEW.fecha_turno := v_tf.fecha_turno;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_temperatura_before_insert_exec
BEFORE INSERT ON registros_temperatura
FOR EACH ROW EXECUTE FUNCTION trg_temperatura_before_insert();

-- ------------------------------------------------------------------------------
-- 4. DISPARO DE ALERTAS VISUALES DE PARÁMETROS FÍSICOS (Con severidad cuantitativa)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_generar_alertas_fisicas() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_eq equipos%ROWTYPE;
  v_linea_id uuid;
  v_desvio numeric;
  v_severidad text;
  v_esperado text;
  v_registrado text;
  v_mensaje text;
  v_tipo text;
BEGIN
  IF TG_TABLE_NAME = 'registros_batidora' THEN
    IF NEW.dentro_tolerancia = false THEN
      v_desvio := abs(NEW.tiempo_batido_seg - NEW.tiempo_objetivo_seg)::numeric / NEW.tiempo_objetivo_seg * 100.0;
      IF v_desvio > 15.0 THEN
        v_severidad := 'CRITICA';
      ELSE
        v_severidad := 'ADVERTENCIA';
      END IF;
      
      SELECT el.linea_id INTO v_linea_id FROM equipos eq JOIN etapas_linea el ON el.id = eq.etapa_id WHERE eq.id = NEW.equipo_id;
      v_esperado := NEW.tiempo_objetivo_seg || 's ±' || NEW.tolerancia_pct || '%';
      v_registrado := NEW.tiempo_batido_seg || 's';
      v_mensaje := 'Tiempo de batido fuera de tolerancia en batidora (' || v_registrado || ' vs objetivo ' || v_esperado || ')';
      v_tipo := 'TIEMPO_BATIDO_FUERA_TOLERANCIA';

      INSERT INTO alertas (tipo, severidad, linea_id, equipo_id, lote_id, mensaje, valor_registrado, valor_esperado, estado)
      VALUES (v_tipo, v_severidad, v_linea_id, NEW.equipo_id, NEW.lote_id, v_mensaje, v_registrado, v_esperado, 'ACTIVA');
    END IF;

  ELSIF TG_TABLE_NAME = 'registros_angulo' THEN
    IF NEW.dentro_rango = false THEN
      SELECT * INTO v_eq FROM equipos WHERE id = NEW.equipo_id;
      SELECT el.linea_id INTO v_linea_id FROM etapas_linea el WHERE el.id = v_eq.etapa_id;

      IF NEW.angulo_grados < v_eq.angulo_min THEN
        v_desvio := v_eq.angulo_min - NEW.angulo_grados;
      ELSE
        v_desvio := NEW.angulo_grados - v_eq.angulo_max;
      END IF;

      IF v_desvio > 2.0 THEN
        v_severidad := 'CRITICA';
      ELSE
        v_severidad := 'ADVERTENCIA';
      END IF;

      v_esperado := '[' || v_eq.angulo_min || '° - ' || v_eq.angulo_max || '°]';
      v_registrado := NEW.angulo_grados || '°';
      v_mensaje := 'Ángulo fuera de rango en divisora ' || v_eq.codigo || ' (' || v_registrado || ')';
      v_tipo := 'ANGULO_FUERA_RANGO';

      -- Prevenir alerta duplicada activa en el mismo equipo
      IF NOT EXISTS (
        SELECT 1 FROM alertas WHERE equipo_id = NEW.equipo_id AND tipo = v_tipo AND estado = 'ACTIVA'
      ) THEN
        INSERT INTO alertas (tipo, severidad, linea_id, equipo_id, lote_id, mensaje, valor_registrado, valor_esperado, estado)
        VALUES (v_tipo, v_severidad, v_linea_id, NEW.equipo_id, NEW.lote_id, v_mensaje, v_registrado, v_esperado, 'ACTIVA');
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'registros_temperatura' THEN
    IF NEW.dentro_rango = false THEN
      SELECT * INTO v_eq FROM equipos WHERE id = NEW.equipo_id;
      SELECT el.linea_id INTO v_linea_id FROM etapas_linea el WHERE el.id = v_eq.etapa_id;

      IF NEW.temperatura_c < v_eq.temp_min THEN
        v_desvio := v_eq.temp_min - NEW.temperatura_c;
      ELSE
        v_desvio := NEW.temperatura_c - v_eq.temp_max;
      END IF;

      IF v_desvio > 5.0 THEN
        v_severidad := 'CRITICA';
      ELSE
        v_severidad := 'ADVERTENCIA';
      END IF;

      v_esperado := '[' || v_eq.temp_min || '°C - ' || v_eq.temp_max || '°C]';
      v_registrado := NEW.temperatura_c || '°C';
      v_mensaje := 'Temperatura fuera de rango en equipo ' || v_eq.codigo || ' (' || v_registrado || ')';
      v_tipo := 'TEMPERATURA_FUERA_RANGO';

      -- Prevenir alerta duplicada activa en el mismo equipo
      IF NOT EXISTS (
        SELECT 1 FROM alertas WHERE equipo_id = NEW.equipo_id AND tipo = v_tipo AND estado = 'ACTIVA'
      ) THEN
        INSERT INTO alertas (tipo, severidad, linea_id, equipo_id, lote_id, mensaje, valor_registrado, valor_esperado, estado)
        VALUES (v_tipo, v_severidad, v_linea_id, NEW.equipo_id, NEW.lote_id, v_mensaje, v_registrado, v_esperado, 'ACTIVA');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alertas_batidora_exec
AFTER INSERT ON registros_batidora
FOR EACH ROW EXECUTE FUNCTION trg_generar_alertas_fisicas();

CREATE TRIGGER trg_alertas_angulo_exec
AFTER INSERT ON registros_angulo
FOR EACH ROW EXECUTE FUNCTION trg_generar_alertas_fisicas();

CREATE TRIGGER trg_alertas_temperatura_exec
AFTER INSERT ON registros_temperatura
FOR EACH ROW EXECUTE FUNCTION trg_generar_alertas_fisicas();

-- ------------------------------------------------------------------------------
-- 5. DESCUENTO AUTOMÁTICO DE RECETAS Y AUTO-COMPLETADO
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_batidora_descuento_receta() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_lote lotes%ROWTYPE;
  v_op ordenes_produccion%ROWTYPE;
  v_nuevo_producido int;
  v_nuevo_restante int;
BEGIN
  SELECT * INTO v_lote FROM lotes WHERE id = NEW.lote_id;
  SELECT * INTO v_op FROM ordenes_produccion WHERE id = v_lote.orden_produccion_id FOR UPDATE;

  IF v_op.estado = 'COMPLETADA' OR v_op.producido_recetas >= v_op.total_planificado_recetas THEN
    RAISE EXCEPTION 'La orden de producción % ya está COMPLETADA y no tiene recetas restantes.', v_op.codigo_orden;
  END IF;

  v_nuevo_producido := v_op.producido_recetas + 1;
  v_nuevo_restante := v_op.total_planificado_recetas - v_nuevo_producido;

  UPDATE ordenes_produccion
  SET producido_recetas = v_nuevo_producido,
      estado = CASE WHEN v_nuevo_restante = 0 THEN 'COMPLETADA' ELSE 'EN_PROCESO' END,
      updated_at = now()
  WHERE id = v_op.id;

  -- Alerta visual si restante <= porcentaje configurado
  IF v_nuevo_restante <= (v_op.total_planificado_recetas * (v_op.porcentaje_alerta_restante / 100.0)) THEN
    IF NOT EXISTS (
      SELECT 1 FROM alertas 
      WHERE orden_id = v_op.id AND tipo = 'ORDEN_PORCENTAJE_CRITICO' AND estado = 'ACTIVA'
    ) THEN
      INSERT INTO alertas (
        tipo, severidad, linea_id, orden_id, mensaje, valor_registrado, valor_esperado, estado
      ) VALUES (
        'ORDEN_PORCENTAJE_CRITICO',
        CASE WHEN v_nuevo_restante = 0 THEN 'CRITICA' ELSE 'ADVERTENCIA' END,
        v_op.linea_id,
        v_op.id,
        'Orden ' || v_op.codigo_orden || ' en nivel crítico (' || v_nuevo_restante || ' recetas restantes)',
        v_nuevo_restante::text,
        '> 10% de ' || v_op.total_planificado_recetas,
        'ACTIVA'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batidora_descuento_receta_exec
AFTER INSERT ON registros_batidora
FOR EACH ROW EXECUTE FUNCTION trg_batidora_descuento_receta();

-- ------------------------------------------------------------------------------
-- 6. REVERSIÓN DE RECETA ANTE ANULACIÓN DE BATIDORA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_revertir_batidora_anulada() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_lote lotes%ROWTYPE;
BEGIN
  IF OLD.anulado = false AND NEW.anulado = true THEN
    SELECT * INTO v_lote FROM lotes WHERE id = NEW.lote_id;
    
    UPDATE ordenes_produccion
    SET producido_recetas = GREATEST(0, producido_recetas - 1),
        estado = 'EN_PROCESO', -- Reabre orden si figuraba completada
        updated_at = now()
    WHERE id = v_lote.orden_produccion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revertir_batidora_anulada_exec
AFTER UPDATE OF anulado ON registros_batidora
FOR EACH ROW EXECUTE FUNCTION trg_revertir_batidora_anulada();

-- ------------------------------------------------------------------------------
-- 7. INMUTABILIDAD OPERATIVA: Solo se permite anulación formal
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_proteger_columnas_inmutables() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.anulado = true THEN
    RAISE EXCEPTION 'El registro ya se encuentra anulado y no puede ser alterado.';
  END IF;

  IF (NEW.id IS DISTINCT FROM OLD.id) OR
     (NEW.equipo_id IS DISTINCT FROM OLD.equipo_id) OR
     (NEW.fecha_hora IS DISTINCT FROM OLD.fecha_hora) OR
     (NEW.usuario_id IS DISTINCT FROM OLD.usuario_id) THEN
    RAISE EXCEPTION 'No se permite modificar datos operativos originales. Solo se permite la anulación formal por supervisor.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inmutable_batidora BEFORE UPDATE ON registros_batidora FOR EACH ROW EXECUTE FUNCTION trg_proteger_columnas_inmutables();
CREATE TRIGGER trg_inmutable_angulo BEFORE UPDATE ON registros_angulo FOR EACH ROW EXECUTE FUNCTION trg_proteger_columnas_inmutables();
CREATE TRIGGER trg_inmutable_temperatura BEFORE UPDATE ON registros_temperatura FOR EACH ROW EXECUTE FUNCTION trg_proteger_columnas_inmutables();
CREATE TRIGGER trg_inmutable_merma BEFORE UPDATE ON registros_merma FOR EACH ROW EXECUTE FUNCTION trg_proteger_columnas_inmutables();

-- ------------------------------------------------------------------------------
-- 8. FUNCIÓN RPC: anular_registro()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION anular_registro(
  p_tabla text,
  p_id uuid,
  p_motivo text
) RETURNS void
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_rol text;
BEGIN
  v_rol := mi_rol();
  IF v_rol NOT IN ('SUPERVISOR', 'GERENCIA') THEN
    RAISE EXCEPTION 'Permiso denegado: solo Supervisores y Gerencia pueden anular registros.';
  END IF;

  IF p_motivo IS NULL OR length(trim(p_motivo)) < 5 THEN
    RAISE EXCEPTION 'Debe proporcionar un motivo de anulación detallado (mínimo 5 caracteres).';
  END IF;

  IF p_tabla = 'registros_batidora' THEN
    UPDATE registros_batidora SET anulado = true, motivo_anulacion = p_motivo, anulado_por = auth.uid(), anulado_at = now() WHERE id = p_id;
  ELSIF p_tabla = 'registros_angulo' THEN
    UPDATE registros_angulo SET anulado = true, motivo_anulacion = p_motivo, anulado_por = auth.uid(), anulado_at = now() WHERE id = p_id;
  ELSIF p_tabla = 'registros_temperatura' THEN
    UPDATE registros_temperatura SET anulado = true, motivo_anulacion = p_motivo, anulado_por = auth.uid(), anulado_at = now() WHERE id = p_id;
  ELSIF p_tabla = 'registros_merma' THEN
    UPDATE registros_merma SET anulado = true, motivo_anulacion = p_motivo, anulado_por = auth.uid(), anulado_at = now() WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Tabla no válida para anulación.';
  END IF;

  -- Registrar en auditoría
  INSERT INTO auditoria (tabla, registro_id, accion, usuario_id, datos_nuevos)
  VALUES (p_tabla, p_id, 'ANULACION', auth.uid(), jsonb_build_object('motivo', p_motivo, 'fecha', now()));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 9. FLUJO DE LOTES: Funciones Transaccionales Atómicas
-- ------------------------------------------------------------------------------

-- 9.1. Crear lote junto con avance a etapa 1 y primera batida
CREATE OR REPLACE FUNCTION crear_lote_con_batida(
  p_orden_id uuid,
  p_codigo_lote text,
  p_equipo_batidora_id uuid,
  p_tiempo_batido_seg int,
  p_observaciones text DEFAULT NULL
) RETURNS uuid
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_op ordenes_produccion%ROWTYPE;
  v_etapa_1 etapas_linea%ROWTYPE;
  v_lote_id uuid;
BEGIN
  SELECT * INTO v_op FROM ordenes_produccion WHERE id = p_orden_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de producción no encontrada.';
  END IF;

  IF v_op.estado = 'COMPLETADA' OR v_op.restante_recetas <= 0 THEN
    RAISE EXCEPTION 'No se pueden iniciar nuevos lotes: la orden % ya no tiene recetas restantes.', v_op.codigo_orden;
  END IF;

  -- Localizar Etapa 1 (Batidora) de la línea
  SELECT * INTO v_etapa_1 FROM etapas_linea WHERE linea_id = v_op.linea_id AND orden = 1;

  -- 1. Insertar Lote
  INSERT INTO lotes (codigo_lote, orden_produccion_id, etapa_actual_id, estado, created_by)
  VALUES (p_codigo_lote, p_orden_id, v_etapa_1.id, 'EN_PROCESO', auth.uid())
  RETURNING id INTO v_lote_id;

  -- 2. Insertar Avance Etapa 1
  INSERT INTO avance_lote_etapa (lote_id, etapa_id, fecha_hora_ingreso, usuario_id, observaciones)
  VALUES (v_lote_id, v_etapa_1.id, now(), auth.uid(), p_observaciones);

  -- 3. Insertar Registro Batidora (Dispara triggers automáticos de descuento y alerta)
  INSERT INTO registros_batidora (
    lote_id, equipo_id, receta_id, tiempo_batido_seg, usuario_id
  ) VALUES (
    v_lote_id, p_equipo_batidora_id, v_op.receta_id, p_tiempo_batido_seg, auth.uid()
  );

  RETURN v_lote_id;
END;
$$ LANGUAGE plpgsql;

-- 9.2. Avanzar lote a siguiente etapa con validación de secuencia estricta
CREATE OR REPLACE FUNCTION avanzar_lote(
  p_lote_id uuid,
  p_etapa_destino_id uuid,
  p_observaciones text DEFAULT NULL
) RETURNS void
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_lote lotes%ROWTYPE;
  v_etapa_actual etapas_linea%ROWTYPE;
  v_etapa_dest etapas_linea%ROWTYPE;
BEGIN
  SELECT * INTO v_lote FROM lotes WHERE id = p_lote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado.';
  END IF;

  SELECT * INTO v_etapa_actual FROM etapas_linea WHERE id = v_lote.etapa_actual_id;
  SELECT * INTO v_etapa_dest FROM etapas_linea WHERE id = p_etapa_destino_id;

  IF v_etapa_actual.linea_id <> v_etapa_dest.linea_id THEN
    RAISE EXCEPTION 'Violación de proceso: el lote no puede ser transferido a otra línea.';
  END IF;

  IF v_etapa_dest.orden <> (v_etapa_actual.orden + 1) THEN
    RAISE EXCEPTION 'Secuencia inválida: el lote debe avanzar estrictamente a la etapa consecutiva (De Etapa % -> Etapa %).', v_etapa_actual.orden, v_etapa_dest.orden;
  END IF;

  -- Cerrar salida de etapa anterior
  UPDATE avance_lote_etapa
  SET fecha_hora_salida = now()
  WHERE lote_id = p_lote_id AND etapa_id = v_etapa_actual.id AND fecha_hora_salida IS NULL;

  -- Registrar ingreso a nueva etapa
  INSERT INTO avance_lote_etapa (lote_id, etapa_id, fecha_hora_ingreso, usuario_id, observaciones)
  VALUES (p_lote_id, p_etapa_destino_id, now(), auth.uid(), p_observaciones);

  -- Actualizar lote
  UPDATE lotes
  SET etapa_actual_id = p_etapa_destino_id,
      estado = CASE WHEN v_etapa_dest.orden = 8 THEN 'COMPLETADO' ELSE 'EN_PROCESO' END,
      updated_at = now()
  WHERE id = p_lote_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 10. REGLA ESTRICTA DE MERMA (Solo en Empaquetado) Y ACUMULADO POR TURNO
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_validar_y_acumular_merma() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_rol text;
  v_tf RECORD;
  v_acumulado numeric;
  v_limite numeric;
BEGIN
  v_rol := mi_rol();

  -- Restricción: Encargado debe tener asignada la etapa de Empaquetado
  IF v_rol = 'ENCARGADO' THEN
    IF NOT EXISTS (
      SELECT 1 FROM encargado_etapas ee
      JOIN etapas_linea el ON el.id = ee.etapa_id
      WHERE ee.usuario_id = auth.uid() 
        AND el.linea_id = NEW.linea_id 
        AND el.tipo = 'EMPAQUETADO'
    ) THEN
      RAISE EXCEPTION 'Restricción de planta: la merma solo puede ser registrada por operadores asignados a Empaquetado/Calidad o Supervisores.';
    END IF;
  END IF;

  -- Asignar turno y fecha_turno
  SELECT turno, fecha_turno INTO v_tf FROM obtener_turno_y_fecha(NEW.fecha_hora);
  NEW.turno := v_tf.turno;
  NEW.fecha_turno := v_tf.fecha_turno;

  -- Suma acumulada excluyendo anulados
  SELECT COALESCE(SUM(peso_kg), 0) + NEW.peso_kg INTO v_acumulado
  FROM registros_merma
  WHERE linea_id = NEW.linea_id 
    AND turno = v_tf.turno 
    AND fecha_turno = v_tf.fecha_turno 
    AND anulado = false;

  SELECT limite_merma_turno_kg INTO v_limite FROM lineas WHERE id = NEW.linea_id;

  -- Alerta visual si se supera el 80% o 100% del límite de merma de turno
  IF v_acumulado >= (v_limite * 0.8) THEN
    IF NOT EXISTS (
      SELECT 1 FROM alertas
      WHERE linea_id = NEW.linea_id 
        AND tipo = 'LIMITE_MERMA_SUPERADO' 
        AND estado = 'ACTIVA'
    ) THEN
      INSERT INTO alertas (
        tipo, severidad, linea_id, mensaje, valor_registrado, valor_esperado, estado
      ) VALUES (
        'LIMITE_MERMA_SUPERADO',
        CASE WHEN v_acumulado > v_limite THEN 'CRITICA' ELSE 'ADVERTENCIA' END,
        NEW.linea_id,
        'Merma acumulada del turno (' || round(v_acumulado, 2) || ' kg) superó umbral crítico (Límite: ' || v_limite || ' kg)',
        round(v_acumulado, 2) || ' kg',
        '<= ' || v_limite || ' kg',
        'ACTIVA'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_merma_validar_y_acumular_exec
BEFORE INSERT ON registros_merma
FOR EACH ROW EXECUTE FUNCTION trg_validar_y_acumular_merma();

-- ------------------------------------------------------------------------------
-- 11. AUDITORÍA GENERAL
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_auditoria_operativa() RETURNS trigger
SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, usuario_id, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_ordenes AFTER INSERT OR UPDATE ON ordenes_produccion FOR EACH ROW EXECUTE FUNCTION trg_auditoria_operativa();
CREATE TRIGGER trg_audit_equipos AFTER INSERT OR UPDATE ON equipos FOR EACH ROW EXECUTE FUNCTION trg_auditoria_operativa();
CREATE TRIGGER trg_audit_recetas AFTER INSERT OR UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION trg_auditoria_operativa();
