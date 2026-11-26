import { z } from 'zod';

// Esquema para Crear Lote con Batida inicial (Etapa 1: Batidora)
export const crearLoteBatidaSchema = z.object({
  orden_id: z.string().uuid('Debe seleccionar una orden de producción válida'),
  codigo_lote: z
    .string()
    .min(3, 'El código de lote debe contener al menos 3 caracteres')
    .max(50, 'El código de lote es demasiado largo'),
  equipo_batidora_id: z.string().uuid('Debe seleccionar el equipo batidora'),
  minutos: z
    .coerce
    .number()
    .min(0, 'Los minutos no pueden ser negativos')
    .max(120, 'El tiempo de batido no puede superar 120 minutos'),
  segundos: z
    .coerce
    .number()
    .min(0, 'Los segundos deben ser entre 0 y 59')
    .max(59, 'Los segundos deben ser entre 0 y 59'),
  observaciones: z.string().optional().nullable(),
});

export type CrearLoteBatidaFormData = z.infer<typeof crearLoteBatidaSchema>;

// Esquema para Registro de Ángulo de Divisora (Etapa 2)
export const registroAnguloSchema = z.object({
  equipo_id: z.string().uuid('Debe seleccionar la divisora'),
  lote_id: z.string().uuid().optional().nullable(),
  angulo_grados: z
    .coerce
    .number()
    .min(0, 'El ángulo mínimo es 0°')
    .max(360, 'El ángulo máximo es 360°'),
});

export type RegistroAnguloFormData = z.infer<typeof registroAnguloSchema>;

// Esquema para Registro de Temperatura (Celdas, Vapor, Horno)
export const registroTemperaturaSchema = z.object({
  equipo_id: z.string().uuid('Debe seleccionar el equipo térmico'),
  lote_id: z.string().uuid().optional().nullable(),
  temperatura_c: z
    .coerce
    .number()
    .min(-20, 'Temperatura mínima no razonable (-20°C)')
    .max(350, 'Temperatura máxima física excedida (350°C)'),
});

export type RegistroTemperaturaFormData = z.infer<typeof registroTemperaturaSchema>;

// Esquema para Avance de Lote entre etapas
export const avanzarLoteSchema = z.object({
  lote_id: z.string().uuid('Debe seleccionar un lote'),
  etapa_destino_id: z.string().uuid('Debe seleccionar la etapa destino'),
  observaciones: z.string().optional().nullable(),
});

export type AvanzarLoteFormData = z.infer<typeof avanzarLoteSchema>;

// Esquema para Registro de Merma (desperdicio en batidas)
export const registroMermaSchema = z.object({
  lote_id: z.string().uuid('Debe seleccionar un lote').optional().nullable(),
  motivo_merma_id: z.string().uuid('Debe seleccionar un motivo de merma'),
  cantidad: z.coerce
    .number()
    .min(0.1, 'Cantidad debe ser mayor que 0')
    .max(10000, 'Cantidad muy grande'),
  observaciones: z.string().optional().nullable(),
});

export type RegistroMermaFormData = z.infer<typeof registroMermaSchema>;

