/**
 * Zod Validation Schemas
 */

import { z } from 'zod';
import { CLASIFICACION_RIESGO, RESPUESTAS_RIESGO } from '../../../utils/constants';

// ============================================
// RIESGO SCHEMAS
// ============================================

export const createRiesgoSchema = z.object({
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  clasificacion: z.enum([CLASIFICACION_RIESGO.POSITIVA, CLASIFICACION_RIESGO.NEGATIVA]),
  proceso: z.string().min(1, 'El proceso es requerido'),
  zona: z.string().min(1, 'La zona es requerida'),
  tipologiaNivelI: z.string().optional(),
  tipologiaNivelII: z.string().optional(),
  tipologiaNivelIII: z.string().optional(),
  tipologiaNivelIV: z.string().optional(),
  causaRiesgo: z.string().optional(),
  fuenteCausa: z.string().optional(),
});

export type CreateRiesgoFormData = z.infer<typeof createRiesgoSchema>;

// ============================================
// EVALUACIÓN SCHEMAS
// ============================================

const impactoSchema = z.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5');

export const createEvaluacionSchema = z.object({
  riesgoId: z.string().min(1, 'Debe seleccionar un riesgo'),
  impactoPersonas: impactoSchema,
  impactoLegal: impactoSchema,
  impactoAmbiental: impactoSchema,
  impactoProcesos: impactoSchema,
  impactoReputacion: impactoSchema,
  impactoEconomico: impactoSchema,
  impactoTecnologico: impactoSchema,
  probabilidad: z.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5'),
});

export type CreateEvaluacionFormData = z.infer<typeof createEvaluacionSchema>;

// ============================================
// PRIORIZACIÓN SCHEMAS
// ============================================

export const createPriorizacionSchema = z.object({
  riesgoId: z.string().min(1, 'Debe seleccionar un riesgo'),
  respuesta: z.enum(RESPUESTAS_RIESGO as unknown as [string, ...string[]]),
  responsable: z.string().optional(),
  puntajePriorizacion: z.number().optional(),
});

export type CreatePriorizacionFormData = z.infer<typeof createPriorizacionSchema>;

// ============================================
// FILTROS SCHEMAS
// ============================================

export const filtrosRiesgoSchema = z.object({
  busqueda: z.string().optional(),
  clasificacion: z.string().optional(),
  nivelRiesgo: z.string().optional(),
  proceso: z.string().optional(),
  zona: z.string().optional(),
  tipologiaNivelI: z.string().optional(),
});

export type FiltrosRiesgoFormData = z.infer<typeof filtrosRiesgoSchema>;
