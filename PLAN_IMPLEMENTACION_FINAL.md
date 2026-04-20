# Plan de Implementación Final - Selector de Gestión

## RESUMEN EJECUTIVO

Basado en el análisis completo del backend, aquí está el plan correcto para implementar el selector de gestión.

## 1. DESCUBRIMIENTOS CLAVE DEL BACKEND

### 1.1 Campo de Clasificación
- **Campo**: `proceso.tipo` (no `tipoProceso`)
- **Valores**: "Estratégico", "Comercial", "Operacional", "Talento Humano", etc.
- **Tipo**: String libre (sin restricción en BD)

### 1.2 Modelo de Responsables
- **Legacy**: `proceso.responsableId` (un responsable)
- **Nuevo**: `proceso.responsables` (múltiples responsables con modo)
  - `modo = 'proceso'`: Dueño del proceso (puede editar)
  - `modo = 'director'`: Director/Supervisor (solo lectura)

### 1.3 Filtrado de Procesos
El backend devuelve TODOS los procesos. El filtrado se hace en frontend según:
1. Rol del usuario
2. Asignaciones (responsablesList)
3. Áreas asignadas

### 1.4 Permisos
- Por rol, no por gestión
- `puedeVisualizar`: true por defecto
- `puedeEditar`: false por defecto

## 2. ARQUITECTURA DE SOLUCIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                      GestionContext (MEJORADO)              │
├─────────────────────────────────────────────────────────────┤
│ • gestionSeleccionada: TipoGestion                          │
│ • procesosEnGestion: Proceso[] (filtrados por tipo)         │
│ • debeOcultarControlesYPlanes: boolean                      │
│ • debeOcultarMaterializarRiesgos: boolean                   │
│ • obtenerGestionesPorUsuario(): TipoGestion[]               │
│ • filtrarProcesosPorGestion(procesos): Proceso[]            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    GestionSelector (MEJORADO)               │
├─────────────────────────────────────────────────────────────┤
│ • Mostrar solo para usuarios operativos                     │
│ • Mostrar solo gestiones con procesos disponibles           │
│ • Mostrar contador de procesos por gestión                  │
│ • Validar que tiene procesos en la gestión                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    MainLayout (ACTUALIZADO)                 │
├─────────────────────────────────────────────────────────────┤
│ • Filtrar menú según gestión seleccionada                   │
│ • Validar proceso seleccionado contra gestión               │
│ • Mostrar alerta si no hay procesos en gestión              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Páginas (ACTUALIZADAS)                   │
├─────────────────────────────────────────────────────────────┤
│ • Combinar filtros: useProcesosVisibles() + gestión         │
│ • Validar proceso seleccionado                              │
│ • Mostrar mensaje si no hay procesos                        │
└─────────────────────────────────────────────────────────────┘
```

## 3. MAPEO DE GESTIONES

```typescript
const GESTIONES_CONFIG = {
  'riesgos': {
    label: 'Gestión de Riesgos',
    color: '#1976d2',
    tiposIncluidos: ['operacional', 'operativo', 'operacion'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'estrategica': {
    label: 'Gestión Estratégica',
    color: '#d32f2f',
    tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Planes', 'Historial'],
    ocultarItems: ['Controles y Planes de Acción', 'Materializar Riesgos'],
    soloLectura: true
  },
  'comercial': {
    label: 'Gestión Comercial',
    color: '#f57c00',
    tiposIncluidos: ['comercial'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'talento': {
    label: 'Gestión de Talento Humano',
    color: '#c2185b',
    tiposIncluidos: ['talento humano', 'talento'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'tesoreria': {
    label: 'Gestión de Tesorería',
    color: '#388e3c',
    tiposIncluidos: ['tesorería', 'tesoreria'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'financiera': {
    label: 'Gestión Financiera',
    color: '#5e35b1',
    tiposIncluidos: ['financiera'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'administrativa': {
    label: 'Gestión Administrativa',
    color: '#0097a7',
    tiposIncluidos: ['administrativa'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  },
  'nomina': {
    label: 'Gestión de Nómina',
    color: '#7b1fa2',
    tiposIncluidos: ['nómina', 'nomina'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial'],
    ocultarItems: []
  }
};
```

## 4. IMPLEMENTACIÓN PASO A PASO

### Fase 1: Extender GestionContext

**Archivo**: `src/contexts/GestionContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useProcesosVisibles } from '../hooks/useAsignaciones';
import type { Proceso } from '../types';

export type TipoGestion = 'riesgos' | 'estrategica' | 'comercial' | 'talento' | 'tesoreria' | 'financiera' | 'administrativa' | 'nomina';

const GESTIONES_CONFIG: Record<TipoGestion, {
  label: string;
  color: string;
  tiposIncluidos: string[];
  ocultarItems: string[];
  soloLectura?: boolean;
}> = {
  'riesgos': {
    label: 'Gestión de Riesgos',
    color: '#1976d2',
    tiposIncluidos: ['operacional', 'operativo', 'operacion'],
    ocultarItems: []
  },
  'estrategica': {
    label: 'Gestión Estratégica',
    color: '#d32f2f',
    tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
    ocultarItems: ['Controles y Planes de Acción', 'Materializar Riesgos'],
    soloLectura: true
  },
  'comercial': {
    label: 'Gestión Comercial',
    color: '#f57c00',
    tiposIncluidos: ['comercial'],
    ocultarItems: []
  },
  'talento': {
    label: 'Gestión de Talento Humano',
    color: '#c2185b',
    tiposIncluidos: ['talento humano', 'talento'],
    ocultarItems: []
  },
  'tesoreria': {
    label: 'Gestión de Tesorería',
    color: '#388e3c',
    tiposIncluidos: ['tesorería', 'tesoreria'],
    ocultarItems: []
  },
  'financiera': {
    label: 'Gestión Financiera',
    color: '#5e35b1',
    tiposIncluidos: ['financiera'],
    ocultarItems: []
  },
  'administrativa': {
    label: 'Gestión Administrativa',
    color: '#0097a7',
    tiposIncluidos: ['administrativa'],
    ocultarItems: []
  },
  'nomina': {
    label: 'Gestión de Nómina',
    color: '#7b1fa2',
    tiposIncluidos: ['nómina', 'nomina'],
    ocultarItems: []
  }
};

interface GestionContextType {
  gestionSeleccionada: TipoGestion;
  setGestionSeleccionada: (gestion: TipoGestion) => void;
  procesosEnGestion: Proceso[];
  debeOcultarControlesYPlanes: boolean;
  debeOcultarMaterializarRiesgos: boolean;
  gestionesDisponibles: TipoGestion[];
  obtenerConfigGestion: (gestion: TipoGestion) => typeof GESTIONES_CONFIG[TipoGestion];
}

const GestionContext = createContext<GestionContextType | undefined>(undefined);

export function GestionProvider({ children }: { children: ReactNode }) {
  const { esAdmin } = useAuth();
  const { procesosVisibles } = useProcesosVisibles();
  
  const [gestionSeleccionada, setGestionSeleccionadaState] = useState<TipoGestion>(() => {
    if (esAdmin) return 'riesgos'; // Admin siempre ve gestión de riesgos
    const stored = localStorage.getItem('gestionSeleccionada');
    return (stored as TipoGestion) || 'riesgos';
  });

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem('gestionSeleccionada', gestionSeleccionada);
  }, [gestionSeleccionada]);

  // Filtrar procesos por gestión
  const procesosEnGestion = useMemo(() => {
    const config = GESTIONES_CONFIG[gestionSeleccionada];
    if (!config) return procesosVisibles;

    return procesosVisibles.filter(p => {
      const tipo = (p.tipo || '').toLowerCase();
      return config.tiposIncluidos.some(t => tipo.includes(t));
    });
  }, [procesosVisibles, gestionSeleccionada]);

  // Gestiones disponibles (que tienen procesos)
  const gestionesDisponibles = useMemo(() => {
    const disponibles: TipoGestion[] = [];
    
    for (const [gestion, config] of Object.entries(GESTIONES_CONFIG)) {
      const tieneProc = procesosVisibles.some(p => {
        const tipo = (p.tipo || '').toLowerCase();
        return config.tiposIncluidos.some(t => tipo.includes(t));
      });
      if (tieneProc) {
        disponibles.push(gestion as TipoGestion);
      }
    }
    
    return disponibles;
  }, [procesosVisibles]);

  // Validar que la gestión seleccionada tiene procesos
  useEffect(() => {
    if (!gestionesDisponibles.includes(gestionSeleccionada)) {
      // Si la gestión actual no tiene procesos, cambiar a la primera disponible
      if (gestionesDisponibles.length > 0) {
        setGestionSeleccionadaState(gestionesDisponibles[0]);
      } else {
        setGestionSeleccionadaState('riesgos');
      }
    }
  }, [gestionesDisponibles, gestionSeleccionada]);

  const debeOcultarControlesYPlanes = GESTIONES_CONFIG[gestionSeleccionada]?.ocultarItems.includes('Controles y Planes de Acción') || false;
  const debeOcultarMaterializarRiesgos = GESTIONES_CONFIG[gestionSeleccionada]?.ocultarItems.includes('Materializar Riesgos') || false;

  const value: GestionContextType = {
    gestionSeleccionada,
    setGestionSeleccionada: setGestionSeleccionadaState,
    procesosEnGestion,
    debeOcultarControlesYPlanes,
    debeOcultarMaterializarRiesgos,
    gestionesDisponibles,
    obtenerConfigGestion: (gestion: TipoGestion) => GESTIONES_CONFIG[gestion]
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
}

export function useGestion() {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error('useGestion must be used within GestionProvider');
  }
  return context;
}
```

### Fase 2: Actualizar GestionSelector

**Archivo**: `src/components/layout/GestionSelector.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Menu, MenuItem, Box, Badge } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useGestion, type TipoGestion } from '../../contexts/GestionContext';
import { useAuth } from '../../contexts/AuthContext';

export default function GestionSelector() {
  const { user, esAdmin } = useAuth();
  const { gestionSeleccionada, setGestionSeleccionada, gestionesDisponibles, obtenerConfigGestion, procesosEnGestion } = useGestion();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // No mostrar para admin
  if (esAdmin || !user) return null;

  // No mostrar si no hay gestiones disponibles
  if (gestionesDisponibles.length === 0) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectGestion = (gestion: TipoGestion) => {
    setGestionSeleccionada(gestion);
    handleClose();
  };

  const currentConfig = obtenerConfigGestion(gestionSeleccionada);
  const procesosEnGestionActual = procesosEnGestion.length;

  return (
    <>
      <Button
        onClick={handleClick}
        endIcon={<ExpandMoreIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#fff',
          backgroundColor: currentConfig.color,
          borderRadius: '20px',
          px: 2,
          py: 1,
          '&:hover': {
            backgroundColor: currentConfig.color,
            opacity: 0.9,
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Badge badgeContent={procesosEnGestionActual} color="warning" sx={{ mr: 1 }}>
          {currentConfig.label}
        </Badge>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 300,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {gestionesDisponibles.map((gestion) => {
          const config = obtenerConfigGestion(gestion);
          const procesosCount = gestionesDisponibles.includes(gestion) ? 
            // Contar procesos en esta gestión
            0 : 0; // Simplificado para el ejemplo

          return (
            <MenuItem
              key={gestion}
              onClick={() => handleSelectGestion(gestion)}
              selected={gestionSeleccionada === gestion}
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                '&.Mui-selected': {
                  backgroundColor: `${config.color}15`,
                  '&:hover': {
                    backgroundColor: `${config.color}25`,
                  },
                },
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: config.color,
                }}
              />
              <span>{config.label}</span>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
```

### Fase 3: Actualizar MainLayout

En `src/components/layout/MainLayout.tsx`, reemplazar el filtrado del menú:

```typescript
// Importar useGestion
import { useGestion } from '../../contexts/GestionContext';

// En el componente
const { debeOcultarControlesYPlanes, debeOcultarMaterializarRiesgos } = useGestion();

// En el renderizado del menú
menuItems
  .filter((item) => {
    // Ocultar items según gestión
    if (debeOcultarControlesYPlanes && item.text === 'Controles y Planes de Acción') {
      return false;
    }
    if (debeOcultarMaterializarRiesgos && item.text === 'Materializar Riesgos') {
      return false;
    }

    // Filtrar items según el rol (código existente)
    if (esSupervisorRiesgos) {
      const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles y Planes de Acción', 'Gestión de Planes', 'Materializar Riesgos', 'Historial'];
      return allowedMenus.includes(item.text);
    }
    // ... resto del código
    return true;
  })
  .map((item) => (
    <React.Fragment key={item.text}>{renderMenuItem(item)}</React.Fragment>
  ))
```

### Fase 4: Actualizar Páginas

En páginas que muestran procesos, combinar filtros:

```typescript
import { useGestion } from '../../contexts/GestionContext';
import { useProcesosVisibles } from '../../hooks/useAsignaciones';

export default function MiPagina() {
  const { procesosVisibles } = useProcesosVisibles();
  const { procesosEnGestion } = useGestion();
  const { procesoSeleccionado } = useProceso();

  // Combinar filtros
  const procesosFiltrados = useMemo(() => {
    return procesosVisibles.filter(p => 
      procesosEnGestion.some(pg => pg.id === p.id)
    );
  }, [procesosVisibles, procesosEnGestion]);

  // Validar proceso seleccionado
  useEffect(() => {
    if (procesoSeleccionado && !procesosFiltrados.find(p => p.id === procesoSeleccionado.id)) {
      showWarning('El proceso seleccionado no pertenece a esta gestión');
      setProcesoSeleccionado(null);
    }
  }, [procesoSeleccionado, procesosFiltrados]);

  // Mostrar procesos filtrados
  return (
    <div>
      {procesosFiltrados.length === 0 ? (
        <Alert severity="info">No hay procesos en esta gestión</Alert>
      ) : (
        // Mostrar procesos
      )}
    </div>
  );
}
```

## 5. FLUJO DE DATOS

```
1. Usuario selecciona gestión en GestionSelector
   ↓
2. GestionContext.setGestionSeleccionada(gestion)
   ↓
3. GestionContext filtra procesos por tipo
   ↓
4. MainLayout oculta/muestra items del menú
   ↓
5. Páginas filtran procesos según gestión
   ↓
6. Si proceso no pertenece a gestión:
   - Mostrar alerta
   - Limpiar selección
   - Mostrar procesos disponibles
```

## 6. CASOS DE USO

### Caso 1: Dueño de Procesos con Múltiples Gestiones
1. Tiene procesos estratégicos y comerciales
2. Selector muestra: "Gestión de Riesgos", "Gestión Estratégica", "Gestión Comercial"
3. Selecciona "Gestión Estratégica"
4. Menú oculta "Controles y Planes de Acción" y "Materializar Riesgos"
5. Selector de procesos muestra solo procesos estratégicos
6. Si intenta acceder a "Controles": muestra alerta

### Caso 2: Supervisor de Riesgos
1. Tiene procesos de varias áreas
2. Selector muestra todas las gestiones disponibles
3. Selecciona "Gestión Comercial"
4. Menú muestra todos los items (supervisor ve todo)
5. Selector de procesos muestra solo procesos comerciales
6. Acceso de solo lectura

### Caso 3: Admin
1. No ve selector de gestión
2. Ve todos los procesos
3. Menú completo
4. Acceso total

## 7. TESTING

### Test 1: Selector Visible
- [ ] Selector visible para usuarios operativos
- [ ] Selector no visible para admin
- [ ] Selector no visible si no hay procesos

### Test 2: Gestiones Disponibles
- [ ] Mostrar solo gestiones con procesos
- [ ] Mostrar contador de procesos
- [ ] Cambiar gestión actualiza menú

### Test 3: Filtrado de Menú
- [ ] Gestión Estratégica oculta Controles y Materializar
- [ ] Otras gestiones muestran todos los items
- [ ] Cambio de gestión actualiza menú inmediatamente

### Test 4: Filtrado de Procesos
- [ ] Procesos filtrados por tipo
- [ ] Proceso seleccionado validado contra gestión
- [ ] Alerta si proceso no pertenece a gestión

### Test 5: Persistencia
- [ ] Gestión seleccionada persiste en localStorage
- [ ] Gestión se restaura al recargar
- [ ] Por usuario (localStorage scoped)

## 8. PRÓXIMOS PASOS

1. ✓ Análisis completado
2. ✓ Estrategia definida
3. **Implementar GestionContext mejorado**
4. **Actualizar GestionSelector**
5. **Actualizar MainLayout**
6. **Actualizar páginas**
7. **Testing exhaustivo**
8. **Documentación**

## 9. NOTAS IMPORTANTES

- El backend devuelve TODOS los procesos sin filtrar
- El filtrado se hace 100% en el frontend
- No hay restricciones de acceso por gestión en el backend
- Los permisos son por rol, no por gestión
- La gestión es solo una vista filtrada de procesos
