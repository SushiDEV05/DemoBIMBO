-- ==============================================================================
-- SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
-- SEED DATA: [DATOS DE EJEMPLO / CALIBRACIÓN ACADÉMICA]
-- Las líneas, recetas y tolerancias reflejan parámetros de referencia académica
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. LÍNEAS DE PRODUCCIÓN
-- ------------------------------------------------------------------------------
INSERT INTO lineas (id, codigo, nombre, limite_merma_turno_kg, activa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'PAN', 'Línea de Pan Blanco y Especialidades', 60.00, true),
  ('22222222-2222-2222-2222-222222222222', 'BOLLERIA', 'Línea de Bollería y Hamburguesas', 45.00, true),
  ('33333333-3333-3333-3333-333333333333', 'PANQUELERIA', 'Línea de Panquelería y Pastelería', 35.00, true)
ON CONFLICT (codigo) DO UPDATE 
SET nombre = EXCLUDED.nombre, limite_merma_turno_kg = EXCLUDED.limite_merma_turno_kg;

-- ------------------------------------------------------------------------------
-- 2. ETAPAS POR LÍNEA (8 etapas secuenciales por cada una de las 3 líneas)
-- ------------------------------------------------------------------------------
-- Línea PAN
INSERT INTO etapas_linea (id, linea_id, nombre, tipo, orden, activa) VALUES
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Batidora Industrial Pan', 'BATIDORA', 1, true),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Divisora de Masa Pan', 'DIVISORA', 2, true),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Celdas de Fermentación Pan', 'CELDAS', 3, true),
  ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Cámara de Vapor Pan', 'VAPOR', 4, true),
  ('a1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Banda de Guarniciones Pan', 'GUARNICIONES', 5, true),
  ('a1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Horno Túnel Pan', 'HORNO', 6, true),
  ('a1000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Banda de Desmolde Pan', 'DESMOLDE', 7, true),
  ('a1000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Empaquetado y Calidad Pan', 'EMPAQUETADO', 8, true)
ON CONFLICT (linea_id, orden) DO NOTHING;

-- Línea BOLLERIA
INSERT INTO etapas_linea (id, linea_id, nombre, tipo, orden, activa) VALUES
  ('a2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Batidora Industrial Bollería', 'BATIDORA', 1, true),
  ('a2000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Divisora de Masa Bollería', 'DIVISORA', 2, true),
  ('a2000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Celdas de Fermentación Bollería', 'CELDAS', 3, true),
  ('a2000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Cámara de Vapor Bollería', 'VAPOR', 4, true),
  ('a2000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Banda de Sésamo / Guarniciones', 'GUARNICIONES', 5, true),
  ('a2000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Horno Continuo Bollería', 'HORNO', 6, true),
  ('a2000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Banda de Desmolde Bollería', 'DESMOLDE', 7, true),
  ('a2000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Empaquetado y Calidad Bollería', 'EMPAQUETADO', 8, true)
ON CONFLICT (linea_id, orden) DO NOTHING;

-- Línea PANQUELERIA
INSERT INTO etapas_linea (id, linea_id, nombre, tipo, orden, activa) VALUES
  ('a3000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Batidora Planetaria Panquelería', 'BATIDORA', 1, true),
  ('a3000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Dosificadora / Divisora Panqués', 'DIVISORA', 2, true),
  ('a3000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Celdas de Reposo Panquelería', 'CELDAS', 3, true),
  ('a3000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Cámara de Humectación / Vapor', 'VAPOR', 4, true),
  ('a3000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Banda de Toppings / Nuez', 'GUARNICIONES', 5, true),
  ('a3000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'Horno Rotativo Panqués', 'HORNO', 6, true),
  ('a3000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 'Banda de Desmolde Especial', 'DESMOLDE', 7, true),
  ('a3000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 'Empaquetado y Calidad Panqués', 'EMPAQUETADO', 8, true)
ON CONFLICT (linea_id, orden) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. EQUIPOS POR ETAPA CON UMBRALES FÍSICOS [DATOS DE EJEMPLO / CALIBRACIÓN]
-- ------------------------------------------------------------------------------
-- Equipos Línea PAN
INSERT INTO equipos (id, etapa_id, codigo, nombre, tipo_parametro, temp_min, temp_max, angulo_min, angulo_max) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'BAT-PAN-01', 'Batidora San Cassiano 500kg', 'TIEMPO', NULL, NULL, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'DIV-PAN-01', 'Divisora Volumétrica Benier', 'ANGULO', NULL, NULL, 15.00, 45.00),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'CEL-PAN-01', 'Celda de Fermentación Proofer A', 'TEMPERATURA', 28.00, 34.00, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'VAP-PAN-01', 'Cámara de Inyección de Vapor', 'TEMPERATURA', 55.00, 65.00, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'GUA-PAN-01', 'Aplicador de Salvado y Granos', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'HOR-PAN-01', 'Horno Túnel Gas Directo 30m', 'TEMPERATURA', 200.00, 230.00, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'DES-PAN-01', 'Desmoldadora por Succión Vacío', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'EMP-PAN-01', 'Ensacadora Automática Formost', 'NINGUNO', NULL, NULL, NULL, NULL)
ON CONFLICT (codigo) DO NOTHING;

-- Equipos Línea BOLLERIA
INSERT INTO equipos (id, etapa_id, codigo, nombre, tipo_parametro, temp_min, temp_max, angulo_min, angulo_max) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'BAT-BOL-01', 'Batidora Espiral Diosna 400kg', 'TIEMPO', NULL, NULL, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'DIV-BOL-01', 'Divisora Boleadora AMF', 'ANGULO', NULL, NULL, 20.00, 50.00),
  ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 'CEL-BOL-01', 'Cámara de Fermentación Proofer B', 'TEMPERATURA', 30.00, 36.00, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004', 'VAP-BOL-01', 'Generador de Vapor Bollería', 'TEMPERATURA', 58.00, 68.00, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000005', 'GUA-BOL-01', 'Espolvoreador de Sésamo', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000006', 'HOR-BOL-01', 'Horno Continuo Malla 24m', 'TEMPERATURA', 210.00, 240.00, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000007', 'a2000000-0000-0000-0000-000000000007', 'DES-BOL-01', 'Banda Volteadora Mecánica', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b2000000-0000-0000-0000-000000000008', 'a2000000-0000-0000-0000-000000000008', 'EMP-BOL-01', 'Empaquetadora Flowpack Ilapak', 'NINGUNO', NULL, NULL, NULL, NULL)
ON CONFLICT (codigo) DO NOTHING;

-- Equipos Línea PANQUELERIA
INSERT INTO equipos (id, etapa_id, codigo, nombre, tipo_parametro, temp_min, temp_max, angulo_min, angulo_max) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'BAT-PQ-01', 'Batidora Planetaria Tonelli 300L', 'TIEMPO', NULL, NULL, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'DIV-PQ-01', 'Dosificadora Pistón Neumático', 'ANGULO', NULL, NULL, 10.00, 35.00),
  ('b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'CEL-PQ-01', 'Cámara de Reposo y Asentamiento', 'TEMPERATURA', 22.00, 27.00, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000004', 'VAP-PQ-01', 'Inyector de Humedad Térmica', 'TEMPERATURA', 48.00, 58.00, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000005', 'GUA-PQ-01', 'Dispensador de Nuez Picada', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000006', 'HOR-PQ-01', 'Horno Rotativo Multicarro', 'TEMPERATURA', 175.00, 195.00, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000007', 'DES-PQ-01', 'Mesa Desmoldadora Silicona', 'NINGUNO', NULL, NULL, NULL, NULL),
  ('b3000000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000008', 'EMP-PQ-01', 'Empacadora Horizontal Termosellable', 'NINGUNO', NULL, NULL, NULL, NULL)
ON CONFLICT (codigo) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TURNOS DE TRABAJO (Horarios de Planta Bimbo)
-- ------------------------------------------------------------------------------
INSERT INTO turnos_config (codigo, nombre, hora_inicio, hora_fin, cruza_medianoche) VALUES
  ('MANANA', 'Turno Mañana', '06:00:00', '14:00:00', false),
  ('TARDE', 'Turno Tarde', '14:00:00', '22:00:00', false),
  ('NOCHE', 'Turno Noche', '22:00:00', '06:00:00', true)
ON CONFLICT (codigo) DO UPDATE 
SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin, cruza_medianoche = EXCLUDED.cruza_medianoche;

-- ------------------------------------------------------------------------------
-- 5. CATÁLOGO DE PRODUCTOS [EJEMPLO ACADÉMICO]
-- ------------------------------------------------------------------------------
INSERT INTO productos (id, linea_id, codigo, nombre, peso_unitario_g, activo) VALUES
  ('c1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'PRD-PAN-01', 'Pan Blanco Bimbo Grande 680g', 680.00, true),
  ('c1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'PRD-PAN-02', 'Pan Integral Bimbo 100% 620g', 620.00, true),
  ('c2000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'PRD-BOL-01', 'Medias Noches Bimbo 8 pzas 340g', 340.00, true),
  ('c2000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'PRD-BOL-02', 'Bimbollos Ajonjolí 8 pzas 450g', 450.00, true),
  ('c3000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'PRD-PQ-01', 'Panqué con Nuez Bimbo 255g', 255.00, true),
  ('c3000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'PRD-PQ-02', 'Panqué Marmoleado Bimbo 255g', 255.00, true)
ON CONFLICT (codigo) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. RECETAS ESTÁNDAR [DATOS DE EJEMPLO / CALIBRACIÓN ACADÉMICA]
-- ------------------------------------------------------------------------------
INSERT INTO recetas (id, producto_id, codigo, nombre, tiempo_objetivo_seg, tolerancia_pct, piezas_por_receta, activo) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'REC-PAN-BLANCO', 'Fórmula Pan Blanco Clásico (8 min batido)', 480, 5.00, 50, true),
  ('d2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'REC-MEDIAS-NOCHES', 'Fórmula Medias Noches Hot Dog (7 min batido)', 420, 5.00, 80, true),
  ('d3000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001', 'REC-PANQUE-NUEZ', 'Fórmula Panqué Batido Esponjoso (10 min batido)', 600, 5.00, 40, true)
ON CONFLICT (codigo) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. CATÁLOGO DE MOTIVOS DE MERMA
-- ------------------------------------------------------------------------------
INSERT INTO motivos_merma (codigo, nombre, activo) VALUES
  ('MOT-01', 'Quemado por exceso de calor en horno', true),
  ('MOT-02', 'Deforme / Masa aplastada o caída', true),
  ('MOT-03', 'Mal horneado / Centro crudo o blando', true),
  ('MOT-04', 'Caído de la banda al suelo', true),
  ('MOT-05', 'Defecto de empaque / Rotura de envoltura', true),
  ('MOT-06', 'Pegado en molde de desmolde', true),
  ('MOT-07', 'Contaminación física o visual', true),
  ('MOT-99', 'Otro motivo operativo', true)
ON CONFLICT (codigo) DO NOTHING;
