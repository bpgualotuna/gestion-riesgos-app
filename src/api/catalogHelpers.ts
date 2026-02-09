/**
 * Helpers para transformar datos de catálogos de la API
 * Sustituye funciones que antes estaban en mockData
 */

export const getLabelsFrecuencia = (frecuencias: { id: number; label?: string; descripcion?: string }[] = []) =>
  frecuencias.map((f) => ({ id: f.id, label: f.label ?? f.descripcion ?? String(f.id), descripcion: f.descripcion }));

export const getFuentesCausa = (fuentes: { id: number; nombre?: string; codigo?: string }[] = []) =>
  fuentes.map((f) => ({ id: f.id, nombre: f.nombre ?? f.codigo ?? String(f.id) }));

export const getDescripcionesImpacto = (impactos: any[] = []) => {
  const byTipo: Record<string, Record<number, string>> = {};
  (impactos || []).forEach((imp: any) => {
    const tipo = imp.tipo ?? imp.categoria ?? 'general';
    if (!byTipo[tipo]) byTipo[tipo] = {};
    const nivel = imp.valor ?? imp.nivel ?? 0;
    byTipo[tipo][nivel] = imp.descripcion ?? '';
  });
  return byTipo;
};
