import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Riesgo } from '../types';
import { resolverCoordsResidualMapa } from './mapaResidualCoords';

vi.mock('./residualDesdeCausas', () => ({
  calcularResidualDesdeCausas: vi.fn(() => ({
    probabilidadResidual: 2,
    impactoResidual: 3,
    riesgoResidual: 6,
    nivelRiesgoResidual: 'Medio',
  })),
}));

import { calcularResidualDesdeCausas } from './residualDesdeCausas';

describe('resolverCoordsResidualMapa', () => {
  beforeEach(() => {
    vi.mocked(calcularResidualDesdeCausas).mockClear();
  });

  it('modo ESTRATEGICO prioriza evaluacion.probabilidadResidual / impactoResidual', () => {
    const punto = { probabilidad: 5, impacto: 5, probabilidadResidual: 1, impactoResidual: 1 };
    const riesgo = {
      id: 1,
      procesoId: 1,
      descripcion: '',
      clasificacion: 'Negativa',
      proceso: '',
      numero: 1,
      evaluacion: {
        id: 1,
        riesgoId: 1,
        impactoPersonas: 1,
        impactoLegal: 1,
        impactoAmbiental: 1,
        impactoProcesos: 1,
        impactoReputacion: 1,
        impactoEconomico: 1,
        impactoTecnologico: 1,
        probabilidad: 5,
        impactoGlobal: 5,
        impactoMaximo: 5,
        riesgoInherente: 25,
        nivelRiesgo: 'Crítico',
        probabilidadResidual: 4,
        impactoResidual: 2,
      },
    } as unknown as Riesgo;

    expect(resolverCoordsResidualMapa(punto, riesgo, 'ESTRATEGICO')).toEqual({
      probabilidadResidual: 4,
      impactoResidual: 2,
    });
    expect(calcularResidualDesdeCausas).not.toHaveBeenCalled();
  });

  it('modo ESTRATEGICO usa punto backend si evaluacion no tiene coords válidas', () => {
    const punto = { probabilidad: 5, impacto: 5, probabilidadResidual: 3, impactoResidual: 4 };
    const riesgo = {
      id: 1,
      procesoId: 1,
      descripcion: '',
      clasificacion: 'Negativa',
      proceso: '',
      numero: 1,
      evaluacion: {
        id: 1,
        riesgoId: 1,
        impactoPersonas: 1,
        impactoLegal: 1,
        impactoAmbiental: 1,
        impactoProcesos: 1,
        impactoReputacion: 1,
        impactoEconomico: 1,
        impactoTecnologico: 1,
        probabilidad: 5,
        impactoGlobal: 5,
        impactoMaximo: 5,
        riesgoInherente: 25,
        nivelRiesgo: 'Crítico',
      },
    } as unknown as Riesgo;

    expect(resolverCoordsResidualMapa(punto, riesgo, 'ESTRATEGICO')).toEqual({
      probabilidadResidual: 3,
      impactoResidual: 4,
    });
    expect(calcularResidualDesdeCausas).not.toHaveBeenCalled();
  });

  it('modo ESTANDAR usa calcularResidualDesdeCausas cuando hay riesgo', () => {
    const punto = { probabilidad: 4, impacto: 4 };
    const riesgo = {
      id: 1,
      procesoId: 1,
      descripcion: '',
      clasificacion: 'Negativa',
      proceso: '',
      numero: 1,
    } as Riesgo;

    expect(resolverCoordsResidualMapa(punto, riesgo, 'ESTANDAR')).toEqual({
      probabilidadResidual: 2,
      impactoResidual: 3,
    });
    expect(calcularResidualDesdeCausas).toHaveBeenCalledWith(riesgo);
  });
});
