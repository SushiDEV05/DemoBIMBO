-- ==============================================================================
-- SISTEMA CONTROL CRÍTICO DE PLANTA (BIMBO)
-- TEST SUITE 01: Verificación de Aislamiento RLS por Rol y Línea
-- ==============================================================================

-- 1. Verificar que un Encargado de PAN NO puede leer registros de BOLLERIA
-- Simular sesión de Encargado Pan:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claim.sub" = 'ID_DEL_ENCARGADO_PAN';

-- Consulta esperada para Encargado Pan:
-- SELECT COUNT(*) FROM lineas WHERE codigo = 'BOLLERIA'; -- Devuelve 1 (catálogo público)
-- SELECT COUNT(*) FROM registros_merma WHERE linea_id = '22222222-2222-2222-2222-222222222222'; -- Debe devolver 0 (aislado a su línea)

-- 2. Verificar que un Encargado NO puede ejecutar UPDATE ni DELETE sobre tablas operativas
-- UPDATE registros_batidora SET tiempo_batido_seg = 999 WHERE id = '...';
-- Resultado esperado: Rechazado por política batidora_update (0 filas actualizadas o error RLS)
-- DELETE FROM registros_batidora WHERE id = '...';
-- Resultado esperado: Rechazado por política batidora_delete

-- 3. Verificar que nadie puede modificar su propio rol en profiles
-- UPDATE profiles SET rol = 'GERENCIA' WHERE id = auth.uid();
-- Resultado esperado: Rechazado por profiles_update_policy (solo Gerencia puede actualizar)

-- 4. Verificar que el Supervisor puede ver todas las líneas si supervisa_todas = true
-- SELECT COUNT(*) FROM ordenes_produccion; -- Devuelve las órdenes de todas las 3 líneas
