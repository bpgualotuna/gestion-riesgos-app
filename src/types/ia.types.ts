/**
 * Tipos para el contexto de pantalla de CORA IA
 */

export interface ScreenContext {
  module: string; // 'procesos', 'riesgos', 'controles', 'planes', 'incidencias', etc.
  screen: string; // 'ficha', 'analisis', 'identificacion', 'evaluacion', 'gestion', etc.
  action: 'create' | 'edit' | 'view'; // Acción actual
  processId?: number; // ID del proceso actual (si aplica)
  riskId?: number; // ID del riesgo actual (si aplica)
  formData?: Record<string, any>; // Datos del formulario actual
  route?: string; // Ruta completa
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
