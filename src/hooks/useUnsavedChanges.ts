/**
 * Hook para detectar y manejar cambios no guardados en formularios
 * Previene navegación accidental cuando hay cambios pendientes
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';

export interface UseUnsavedChangesOptions {
  /**
   * Indica si hay cambios pendientes de guardar
   */
  hasUnsavedChanges: boolean;
  
  /**
   * Mensaje personalizado para el diálogo de confirmación
   */
  message?: string;
  
  /**
   * Callback opcional cuando el usuario intenta navegar con cambios pendientes
   */
  onNavigationAttempt?: () => void;
  
  /**
   * Si es true, no bloqueará la navegación (útil para deshabilitar temporalmente)
   */
  disabled?: boolean;
}

export interface UseUnsavedChangesReturn {
  /**
   * Indica si hay cambios pendientes
   */
  hasUnsavedChanges: boolean;
  
  /**
   * Función para marcar los cambios como guardados
   */
  markAsSaved: () => void;
  
  /**
   * Función para forzar la navegación (descartando cambios)
   */
  forceNavigate: () => void;
  
  /**
   * Estado del bloqueador de navegación
   */
  blocker: ReturnType<typeof useBlocker>;
}

/**
 * Hook principal para manejar cambios no guardados
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const { hasUnsavedChanges, message, onNavigationAttempt, disabled = false } = options;
  const [shouldBlock, setShouldBlock] = useState(false);
  const hasUnsavedRef = useRef(hasUnsavedChanges);

  // Mantener ref actualizado en cada render para que el blocker vea el valor correcto de inmediato
  hasUnsavedRef.current = hasUnsavedChanges && !disabled;

  useEffect(() => {
    setShouldBlock(hasUnsavedChanges && !disabled);
  }, [hasUnsavedChanges, disabled]);

  // Bloquear navegación interna (React Router)
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        // Solo bloquear si hay cambios y no está deshabilitado
        if (!hasUnsavedRef.current || disabled) {
          return false;
        }
        
        // No bloquear si es la misma ruta
        if (currentLocation.pathname === nextLocation.pathname) {
          return false;
        }
        
        // Llamar callback si existe
        if (onNavigationAttempt) {
          onNavigationAttempt();
        }
        
        return true;
      },
      [disabled, onNavigationAttempt]
    )
  );

  // Bloquear navegación externa (cerrar pestaña, recargar, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current && !disabled) {
        e.preventDefault();
        // Chrome requiere returnValue
        e.returnValue = message || '¿Está seguro de que desea salir? Los cambios no guardados se perderán.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [message, disabled]);

  const markAsSaved = useCallback(() => {
    hasUnsavedRef.current = false;
    setShouldBlock(false);
  }, []);

  const forceNavigate = useCallback(() => {
    hasUnsavedRef.current = false;
    setShouldBlock(false);
    if (blocker.state === 'blocked') {
      blocker.proceed?.();
    }
  }, [blocker]);

  return {
    hasUnsavedChanges: shouldBlock,
    markAsSaved,
    forceNavigate,
    blocker,
  };
}

/**
 * Hook simplificado para detectar cambios en objetos
 * Compara el estado inicial con el estado actual
 */
/** Comparación estable por valor (objetos ordenados por clave para evitar falsos positivos) */
function stableJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableJson).join(',') + ']';
  const keys = Object.keys(obj as object).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableJson((obj as Record<string, unknown>)[k])).join(',') + '}';
}

export function useFormChanges<T extends Record<string, any>>(
  initialData: T,
  currentData: T,
  options?: {
    /**
     * Campos a ignorar en la comparación
     */
    ignoreFields?: (keyof T)[];
    
    /**
     * Comparación profunda por valor (por defecto: true para detectar solo cambios reales)
     */
    deepCompare?: boolean;
  }
): boolean {
  const { ignoreFields = [], deepCompare = true } = options || {};

  return useCallback(() => {
    if (!initialData || !currentData) return false;

    const keys = new Set([...Object.keys(initialData), ...Object.keys(currentData)]) as Set<keyof T>;
    
    for (const key of keys) {
      if (ignoreFields.includes(key)) continue;

      const initial = initialData[key];
      const current = currentData[key];

      if (deepCompare) {
        if (stableJson(initial) !== stableJson(current)) return true;
      } else {
        if (initial !== current) return true;
      }
    }

    return false;
  }, [initialData, currentData, ignoreFields, deepCompare])();
}

/**
 * Hook para detectar cambios en arrays
 */
export function useArrayChanges<T>(
  initialArray: T[],
  currentArray: T[],
  options?: {
    /**
     * Función de comparación personalizada
     */
    compareFn?: (a: T, b: T) => boolean;
  }
): boolean {
  const { compareFn } = options || {};

  return useCallback(() => {
    if (!initialArray || !currentArray) return false;
    
    // Diferente longitud = hay cambios
    if (initialArray.length !== currentArray.length) return true;

    // Comparar elementos
    for (let i = 0; i < initialArray.length; i++) {
      const initial = initialArray[i];
      const current = currentArray[i];

      if (compareFn) {
        if (!compareFn(initial, current)) return true;
      } else {
        // Comparación por JSON
        if (JSON.stringify(initial) !== JSON.stringify(current)) return true;
      }
    }

    return false;
  }, [initialArray, currentArray, compareFn])();
}
