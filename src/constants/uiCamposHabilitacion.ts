/**
 * Metadatos de campos gobernados por admin (clave debe coincidir con el backend en catalogos.controller).
 * true en API = el usuario puede editar; false = campo bloqueado en formularios.
 */

export const UI_CAMPO_PLAN_ACCION_FECHA_ESTIMADA_FINALIZACION =
  'plan_accion_fecha_estimada_finalizacion';
export const UI_CAMPO_PLAN_ACCION_FECHA_FINALIZACION =
  'plan_accion_fecha_finalizacion';

export type UiCampoHabilitacionMeta = {
  key: string;
  label: string;
  descripcion: string;
};

export const UI_CAMPOS_HABILITACION_META: UiCampoHabilitacionMeta[] = [
  {
    key: UI_CAMPO_PLAN_ACCION_FECHA_ESTIMADA_FINALIZACION,
    label: 'Plan de acción — Fecha estimada de finalización',
    descripcion:
      'Controles y planes de acción: permite o bloquea editar la fecha estimada tras crear el plan.',
  },
  {
    key: UI_CAMPO_PLAN_ACCION_FECHA_FINALIZACION,
    label: 'Plan de acción — Fecha de finalización',
    descripcion:
      'Controles y planes de acción: permite o bloquea editar la fecha de finalización y la sección de evidencias asociada.',
  },
];
