/**
 * Contexto Interno Page
 * Análisis de factores internos: pestañas Positivo/Negativo, cada categoría con ítems (características) añadibles.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, Edit as EditIcon, ThumbUp as PositivoIcon, ThumbDown as NegativoIcon, Add as AddIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, MoreVert as MoreVertIcon, Send as SendIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { Alert } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';

type CategoryKey = 'financieros' | 'gente' | 'procesos' | 'activosFisicos' | 'cadenaSuministro' | 'informacion' | 'sistemas' | 'proyectos' | 'impuestos' | 'gruposInteresInternos';

const DOFA_DIMENSIONES = [
  { value: 'FORTALEZA', label: 'Fortaleza', letra: 'F' },
  { value: 'OPORTUNIDAD', label: 'Oportunidad', letra: 'O' },
  { value: 'DEBILIDAD', label: 'Debilidad', letra: 'D' },
  { value: 'AMENAZA', label: 'Amenaza', letra: 'A' },
] as const;

type DofaDimension = typeof DOFA_DIMENSIONES[number]['value'];

interface CaracteristicaItem {
  id: string;
  descripcion: string;
  enviarADofa?: boolean;
  dofaDimension?: DofaDimension;
}

const CATEGORIAS: { key: CategoryKey; label: string; tipo: string; descripcion: string }[] = [
  { 
    key: 'financieros', 
    label: 'Financieros', 
    tipo: 'INTERNO_FINANCIEROS',
    descripcion: 'Activos, Activo Corriente, Variables Financieras(tasas, precios, etc.)'
  },
  { 
    key: 'gente', 
    label: 'Gente', 
    tipo: 'INTERNO_GENTE',
    descripcion: 'Fraude Interno, Corrupción, Seguridad Ocupacional, Gobierno Corporativo, Estructura Organizacional, Roles y Responsabilidades, Conocimiento, Habilidades, Actitudes, Aptitudes, Relacionamiento, Valores y Cultura, entre otros.'
  },
  { 
    key: 'procesos', 
    label: 'Procesos', 
    tipo: 'INTERNO_PROCESOS',
    descripcion: 'Actividades, Tareas, Políticas, o Procedimientos; Cambios Organizacionales o en la operación, Procesos Soporte, Sistemas de Gestión, entre otros.'
  },
  { 
    key: 'activosFisicos', 
    label: 'Activos Físicos', 
    tipo: 'INTERNO_ACTIVOSFISICOS',
    descripcion: 'Infraestructura, Vehiculos, etc.'
  },
  { 
    key: 'cadenaSuministro', 
    label: 'Cadena de Suministro', 
    tipo: 'INTERNO_CADENASUMINISTRO',
    descripcion: 'Afectaciones del producto, a nivel nacional e internacional. Por cadena de suministros se entiende, todas las actividades necesarias para la preparación y distribución de un producto para su venta.'
  },
  { 
    key: 'informacion', 
    label: 'Información', 
    tipo: 'INTERNO_INFORMACION',
    descripcion: 'Confidecialidad, integridad y/o disponibilidad de la información confidencial de la compañia.'
  },
  { 
    key: 'sistemas', 
    label: 'Sistemas/Tecnología', 
    tipo: 'INTERNO_SISTEMAS',
    descripcion: 'Nueva, enmendada, y/o tecnología adoptada, entre otros'
  },
  { 
    key: 'proyectos', 
    label: 'Proyectos', 
    tipo: 'INTERNO_PROYECTOS',
    descripcion: 'Aspectos asociados a proyectos de la unidad de negocio.'
  },
  { 
    key: 'impuestos', 
    label: 'Impuestos', 
    tipo: 'INTERNO_IMPUESTOS',
    descripcion: 'Obligaciones Tributarias'
  },
  { 
    key: 'gruposInteresInternos', 
    label: 'Grupos de Interés Internos', 
    tipo: 'INTERNO_GRUPOSINTERESINTERNOS',
    descripcion: 'Son aquellos que trabajan en la compañia y quienes ejercen una influencia directa en la compañia: (junta directiva, la administración, colaboradores, etc.)'
  },
];

const emptyItems = (): Record<CategoryKey, CaracteristicaItem[]> =>
  CATEGORIAS.reduce((acc, { key }) => ({ ...acc, [key]: [] }), {} as Record<CategoryKey, CaracteristicaItem[]>);

export default function ContextoInternoPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { setScreenContext } = useCoraIAContext(); // NUEVO: Hook de CORA IA

  const { data: procesoData, refetch: refetchProceso } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [itemsPositivo, setItemsPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [itemsNegativo, setItemsNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialPositivo, setInitialPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialNegativo, setInitialNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [tabValue, setTabValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [accionMenuAnchor, setAccionMenuAnchor] = useState<{ el: HTMLElement; signo: 'POSITIVO' | 'NEGATIVO'; key: CategoryKey; id: string } | null>(null);
  const [enviandoDofa, setEnviandoDofa] = useState(false);

  const arraysEqual = (a: CaracteristicaItem[], b: CaracteristicaItem[]) =>
    a.length === b.length && a.every((x, i) =>
      x.id === b[i].id && x.descripcion === b[i].descripcion &&
      x.enviarADofa === b[i].enviarADofa && x.dofaDimension === b[i].dofaDimension
    );
  const hasChangesPositivo = CATEGORIAS.some(({ key }) => !arraysEqual(initialPositivo[key], itemsPositivo[key]));
  const hasChangesNegativo = CATEGORIAS.some(({ key }) => !arraysEqual(initialNegativo[key], itemsNegativo[key]));
  const hasAnyChanges = hasChangesPositivo || hasChangesNegativo;

  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasAnyChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en el análisis de contexto interno.',
    disabled: isReadOnly,
  });

  useEffect(() => {
    if (!procesoData) return;
    const pos = emptyItems();
    const neg = emptyItems();
    const items = (procesoData as any).contextoItems as Array<{ id?: number; tipo: string; signo: string; descripcion: string; enviarADofa?: boolean; dofaDimension?: string }> | undefined;
    if (Array.isArray(items)) {
      items.forEach((it) => {
        const cat = CATEGORIAS.find((c) => c.tipo === it.tipo);
        if (!cat) return;
        const entry: CaracteristicaItem = {
          id: String(it.id ?? `${Date.now()}-${Math.random()}`),
          descripcion: it.descripcion ?? '',
          enviarADofa: it.enviarADofa === true,
          dofaDimension: (it.dofaDimension && DOFA_DIMENSIONES.some(d => d.value === it.dofaDimension)) ? (it.dofaDimension as DofaDimension) : undefined,
        };
        if (String(it.signo).toUpperCase() === 'POSITIVO') pos[cat.key].push(entry);
        else if (String(it.signo).toUpperCase() === 'NEGATIVO') neg[cat.key].push(entry);
      });
    }
    // Pasar a la nueva estructura la info que ya estaba en Contexto (base de datos)
    const contextos = procesoData.contextos as Array<{ tipo: string; descripcion: string }> | undefined;
    if (Array.isArray(contextos)) {
      contextos.forEach((c) => {
        const isNeg = c.tipo.endsWith('_NEG');
        const tipoBase = isNeg ? c.tipo.replace(/_NEG$/, '') : c.tipo;
        const cat = CATEGORIAS.find((c2) => c2.tipo === tipoBase);
        if (!cat || !c.descripcion?.trim()) return;
        const entry: CaracteristicaItem = { id: `legacy-${c.tipo}`, descripcion: c.descripcion.trim(), enviarADofa: false };
        // Si esa categoría aún no tiene ítems (p. ej. solo hay datos legacy), añadir este
        if (isNeg) {
          if (neg[cat.key].length === 0) neg[cat.key].push(entry);
        } else {
          if (pos[cat.key].length === 0) pos[cat.key].push(entry);
        }
      });
    }
    setItemsPositivo(pos);
    setItemsNegativo(neg);
    setInitialPositivo(pos);
    setInitialNegativo(neg);
  }, [procesoData]);

  // NUEVO: Actualizar contexto de pantalla para CORA IA
  useEffect(() => {
    if (procesoSeleccionado && setScreenContext) {
      const currentItems = tabValue === 0 ? itemsPositivo : itemsNegativo;
      const signo = tabValue === 0 ? 'POSITIVO' : 'NEGATIVO';
      
      // Recopilar items visibles (primeras 3 categorías con datos)
      const categoriasConDatos = CATEGORIAS.filter(cat => currentItems[cat.key].length > 0).slice(0, 3);
      const itemsVisibles = categoriasConDatos.map(cat => ({
        categoria: cat.label,
        tipo: cat.tipo,
        items: currentItems[cat.key].slice(0, 3).map(it => ({
          descripcion: it.descripcion,
          enviarADofa: it.enviarADofa,
          dofaDimension: it.dofaDimension,
          enDofa: it.descripcion.trim() ? !!getDofaStatus(it.descripcion) : false
        }))
      }));

      const context: ScreenContext = {
        module: 'contexto-interno',
        screen: signo.toLowerCase(),
        action: isReadOnly ? 'view' : 'edit',
        processId: procesoSeleccionado.id,
        route: window.location.pathname,
        formData: {
          signo,
          totalCategorias: CATEGORIAS.length,
          categoriasConDatos: CATEGORIAS.filter(cat => currentItems[cat.key].length > 0).length,
          totalItems: CATEGORIAS.reduce((sum, cat) => sum + currentItems[cat.key].length, 0),
          itemsVisibles,
          hasChanges: hasAnyChanges
        }
      };
      
      setScreenContext(context);
    }
  }, [procesoSeleccionado, tabValue, itemsPositivo, itemsNegativo, isReadOnly, hasAnyChanges, setScreenContext]);

  const addItem = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: `temp-${Date.now()}-${Math.random()}`, descripcion: '', enviarADofa: false }],
    }));
  };

  const updateItem = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string, descripcion: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: prev[key].map((it) => (it.id === id ? { ...it, descripcion } : it)),
    }));
  };

  const updateItemDofa = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string, enviarADofa?: boolean, dofaDimension?: DofaDimension) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: prev[key].map((it) =>
        it.id === id ? { ...it, enviarADofa: enviarADofa ?? it.enviarADofa, dofaDimension: dofaDimension !== undefined ? dofaDimension : it.dofaDimension } : it
      ),
    }));
  };

  const removeItem = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({ ...prev, [key]: prev[key].filter((it) => it.id !== id) }));
  };

  const dofaItems = (procesoData as any)?.dofaItems as Array<{ tipo: string; descripcion: string }> | undefined;
  /** Busca en todo el DOFA (D, O, F, A); si el texto existe en alguna dimensión devuelve cuál, si no null. Solo puede estar en una. */
  const getDofaStatus = (descripcion: string): { dimension: string } | null => {
    if (!descripcion?.trim() || !Array.isArray(dofaItems)) return null;
    const text = descripcion.trim().toLowerCase();
    const found = dofaItems.find((d: any) => (d.descripcion || '').trim().toLowerCase() === text);
    return found ? { dimension: found.tipo } : null;
  };

  const handleSave = async () => {
    if (!procesoSeleccionado) return;
    const itemsInterno: Array<{ tipo: string; signo: string; descripcion: string; enviarADofa?: boolean; dofaDimension?: string }> = [];
    CATEGORIAS.forEach(({ key, tipo }) => {
      itemsPositivo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsInterno.push({
          tipo, signo: 'POSITIVO', descripcion: it.descripcion.trim(),
          enviarADofa: it.enviarADofa === true, dofaDimension: it.dofaDimension || undefined,
        });
      });
      itemsNegativo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsInterno.push({
          tipo, signo: 'NEGATIVO', descripcion: it.descripcion.trim(),
          enviarADofa: it.enviarADofa === true, dofaDimension: it.dofaDimension || undefined,
        });
      });
    });
    const items = (procesoData as any).contextoItems as Array<{ tipo: string; signo: string; descripcion: string }> | undefined;
    const itemsExterno = Array.isArray(items) ? items.filter((it: any) => String(it.tipo).startsWith('EXTERNO_')) : [];
    const contextoItems = [...itemsInterno, ...itemsExterno];
    const existingExternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('EXTERNO_')) || [];

    const currentDofa = (Array.isArray(dofaItems) ? [...dofaItems] : []) as Array<{ tipo: string; descripcion: string }>;
    
    // Crear un mapa de textos antiguos a nuevos para actualizar DOFA
    const textosAntiguosANuevos = new Map<string, { nuevoTexto: string; dimension: string }>();
    
    // Comparar con los valores iniciales para detectar cambios de texto
    CATEGORIAS.forEach(({ key }) => {
      // Positivos
      itemsPositivo[key].forEach((itemActual) => {
        const itemInicial = initialPositivo[key].find(i => i.id === itemActual.id);
        if (itemInicial && itemInicial.descripcion.trim() !== itemActual.descripcion.trim()) {
          // El texto cambió, verificar si el texto antiguo está en DOFA
          const textoAntiguo = itemInicial.descripcion.trim().toLowerCase();
          const textoNuevo = itemActual.descripcion.trim();
          const enDofa = dofaItems?.find((d: any) => (d.descripcion || '').trim().toLowerCase() === textoAntiguo);
          if (enDofa) {
            textosAntiguosANuevos.set(`${enDofa.tipo}:${textoAntiguo}`, { nuevoTexto: textoNuevo, dimension: enDofa.tipo });
          }
        }
      });
      
      // Negativos
      itemsNegativo[key].forEach((itemActual) => {
        const itemInicial = initialNegativo[key].find(i => i.id === itemActual.id);
        if (itemInicial && itemInicial.descripcion.trim() !== itemActual.descripcion.trim()) {
          const textoAntiguo = itemInicial.descripcion.trim().toLowerCase();
          const textoNuevo = itemActual.descripcion.trim();
          const enDofa = dofaItems?.find((d: any) => (d.descripcion || '').trim().toLowerCase() === textoAntiguo);
          if (enDofa) {
            textosAntiguosANuevos.set(`${enDofa.tipo}:${textoAntiguo}`, { nuevoTexto: textoNuevo, dimension: enDofa.tipo });
          }
        }
      });
    });
    
    // Actualizar textos en DOFA que fueron editados
    const dofaActualizado = currentDofa.map((d) => {
      const key = `${d.tipo}:${(d.descripcion || '').trim().toLowerCase()}`;
      const cambio = textosAntiguosANuevos.get(key);
      if (cambio) {
        return { tipo: d.tipo, descripcion: cambio.nuevoTexto };
      }
      return d;
    });
    
    // Agregar nuevos items marcados para enviar a DOFA
    const descInDofa = new Set(dofaActualizado.map((d) => `${d.tipo}:${(d.descripcion || '').trim().toLowerCase()}`));
    itemsInterno.forEach((it) => {
      if (it.enviarADofa && it.dofaDimension && it.descripcion) {
        const key = `${it.dofaDimension}:${it.descripcion.trim().toLowerCase()}`;
        if (!descInDofa.has(key)) {
          dofaActualizado.push({ tipo: it.dofaDimension, descripcion: it.descripcion });
          descInDofa.add(key);
        }
      }
    });
    
    const dofaPayload = dofaActualizado.map((d) => ({ tipo: d.tipo, descripcion: d.descripcion }));

    try {
      setIsSaving(true);
      await updateProceso({
        id: String(procesoSeleccionado.id),
        contextos: existingExternos,
        contextoItems,
        dofaItems: dofaPayload,
      } as any).unwrap();
      setInitialPositivo(itemsPositivo);
      setInitialNegativo(itemsNegativo);
      markAsSaved();
      // Refrescar datos para que getDofaStatus use los nuevos textos
      await refetchProceso();
      showSuccess('Contexto interno guardado.');
    } catch {
      showError('Error al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!isSaving) forceNavigate();
  };

  const handleDiscardChanges = () => {
    setItemsPositivo(initialPositivo);
    setItemsNegativo(initialNegativo);
    forceNavigate();
  };

  const enviarADofaAhora = async (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string) => {
    if (!procesoSeleccionado || !procesoData) return;
    
    // Determinar automáticamente la dimensión DOFA según el contexto y signo
    // Contexto Interno + Positivo → Fortaleza (F)
    // Contexto Interno + Negativo → Debilidad (D)
    // Contexto Externo + Positivo → Oportunidad (O)
    // Contexto Externo + Negativo → Amenaza (A)
    const dimension: DofaDimension = signo === 'POSITIVO' ? 'FORTALEZA' : 'DEBILIDAD';
    const label = DOFA_DIMENSIONES.find(d => d.value === dimension)?.label || dimension;
    
    const items = signo === 'POSITIVO' ? itemsPositivo[key] : itemsNegativo[key];
    const it = items.find((i) => i.id === id);
    if (!it?.descripcion.trim()) return;
    const desc = it.descripcion.trim();
    const currentDofa = (Array.isArray((procesoData as any).dofaItems) ? (procesoData as any).dofaItems : []) as Array<{ tipo: string; descripcion: string }>;
    const yaExiste = currentDofa.some((d) => (d.descripcion || '').trim().toLowerCase() === desc.toLowerCase());
    if (yaExiste) {
      showError('Esta característica ya está en el DOFA.');
      setAccionMenuAnchor(null);
      return;
    }
    const newDofa = [...currentDofa.map((d) => ({ tipo: d.tipo, descripcion: d.descripcion })), { tipo: dimension, descripcion: desc }];
    setEnviandoDofa(true);
    setAccionMenuAnchor(null);
    try {
      await updateProceso({
        id: String(procesoSeleccionado.id),
        dofaItems: newDofa,
      } as any).unwrap();
      updateItemDofa(signo, key, id, true, dimension);
      await refetchProceso();
      showSuccess(`Enviado a ${label}.`);
    } catch {
      showError('Error al enviar a DOFA.');
    } finally {
      setEnviandoDofa(false);
    }
  };

  const renderCategoria = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, label: string, descripcion: string, items: CaracteristicaItem[]) => (
    <Paper
      key={key}
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        minWidth: 0,
        minHeight: 170,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Tooltip title={descripcion} arrow placement="top">
          <Typography variant="subtitle1" fontWeight={700} sx={{ cursor: 'help' }}>{label}</Typography>
        </Tooltip>
        {!isReadOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => addItem(signo, key)}>
            Añadir característica
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">Sin características. Añada al menos una.</Typography>
        )}
        {items.map((it) => {
          const enDofa = it.descripcion.trim() ? getDofaStatus(it.descripcion) : null;
          const estaEnDofa = !!enDofa;
          const marcadoParaEnviar = !!(it.enviarADofa && it.dofaDimension);
          const mostrarVisto = estaEnDofa || marcadoParaEnviar;
          return (
            <Box key={it.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                {/* Icono estado DOFA: ✓ si está/marcado, ✗ si no */}
                <Box sx={{ pt: 1, flexShrink: 0, width: 28, display: 'flex', justifyContent: 'center' }}>
                  {it.descripcion.trim() ? (
                    mostrarVisto ? (
                      <Tooltip title={enDofa ? `En DOFA (${DOFA_DIMENSIONES.find(d => d.value === enDofa.dimension)?.label ?? enDofa.dimension})` : `Enviar como ${it.dofaDimension ? DOFA_DIMENSIONES.find(d => d.value === it.dofaDimension)?.label : ''} (guardar para aplicar)`}>
                        <CheckCircleIcon fontSize="small" color="success" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="No está en ningún cuadrante DOFA">
                        <CancelIcon fontSize="small" color="disabled" />
                      </Tooltip>
                    )
                  ) : null}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  value={it.descripcion}
                  onChange={(e) => updateItem(signo, key, it.id, e.target.value)}
                  disabled={isReadOnly}
                  multiline
                  minRows={2}
                  maxRows={3}
                  placeholder="Descripción de la característica"
                  sx={{
                    maxWidth: 900,
                    flex: '1 1 520px',
                    '& textarea': {
                      minHeight: 64,
                      maxHeight: 96,
                      overflowY: 'auto !important',
                    },
                  }}
                />
                {!isReadOnly && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {marcadoParaEnviar && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        Enviar a: {DOFA_DIMENSIONES.find(d => d.value === it.dofaDimension)?.letra ?? it.dofaDimension?.slice(0, 1)}
                      </Typography>
                    )}
                    <Tooltip title="Acciones">
                      <IconButton
                        size="small"
                        onClick={(e) => setAccionMenuAnchor({ el: e.currentTarget, signo, key, id: it.id })}
                        aria-label="Acciones"
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );

  if (isLoadingProceso) {
    return (
      <AppPageLayout title="Análisis de Contexto Interno" description="Factores internos del proceso" topContent={<FiltroProcesoSupervisor />}>
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout title="Análisis de Contexto Interno" description="Factores internos del proceso" topContent={<FiltroProcesoSupervisor />}>
        <Box sx={{ p: 3 }}><Alert severity="info" variant="outlined">No hay un proceso seleccionado. Por favor seleccione un proceso de la lista en la parte superior.</Alert></Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en el análisis de contexto interno."
        description="¿Guardar antes de salir?"
      />
      <AppPageLayout
        title="Análisis de Contexto Interno"
        description="Factores internos: características por categoría (positivo y negativo)"
        topContent={<FiltroProcesoSupervisor />}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isReadOnly && <Chip icon={<VisibilityIcon />} label="Modo Visualización" color="info" sx={{ fontWeight: 600 }} />}
            {modoProceso === 'editar' && <Chip icon={<EditIcon />} label="Modo Edición" color="warning" sx={{ fontWeight: 600 }} />}
            {!isReadOnly && (
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={isSaving || !hasAnyChanges} sx={{ background: '#1976d2', color: '#fff' }}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </Box>
        }
        alert={isReadOnly ? <Alert severity="info" sx={{ mb: 2 }}>Solo visualización.</Alert> : undefined}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab icon={<PositivoIcon />} iconPosition="start" label="Positivo" />
            <Tab icon={<NegativoIcon />} iconPosition="start" label="Negativo" />
          </Tabs>
        </Box>

        <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)', pr: 0.5, minHeight: 420 }}>
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 960 }}>
              {CATEGORIAS.map(({ key, label, descripcion }) => renderCategoria('POSITIVO', key, label, descripcion, itemsPositivo[key]))}
            </Box>
          )}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 960 }}>
              {CATEGORIAS.map(({ key, label, descripcion }) => renderCategoria('NEGATIVO', key, label, descripcion, itemsNegativo[key]))}
            </Box>
          )}
        </Box>

        {accionMenuAnchor != null && accionMenuAnchor.el != null && (
        <Menu
          anchorEl={accionMenuAnchor.el}
          open
          onClose={() => setAccionMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {accionMenuAnchor && (() => {
            const items = accionMenuAnchor.signo === 'POSITIVO' ? itemsPositivo[accionMenuAnchor.key] : itemsNegativo[accionMenuAnchor.key];
            const it = items.find((i) => i.id === accionMenuAnchor.id);
            if (!it) return null;
            const enDofa = it.descripcion.trim() ? getDofaStatus(it.descripcion) : null;
            const estaEnDofa = !!enDofa;
            const marcadoParaEnviar = !!(it.enviarADofa && it.dofaDimension);
            const puedeEnviar = !estaEnDofa && !!it.descripcion.trim();
            
            // Determinar automáticamente la dimensión según contexto y signo
            const dimensionAutomatica: DofaDimension = accionMenuAnchor.signo === 'POSITIVO' ? 'FORTALEZA' : 'DEBILIDAD';
            const labelAutomatico = DOFA_DIMENSIONES.find(d => d.value === dimensionAutomatica)?.label || dimensionAutomatica;
            
            return (
              <>
                {puedeEnviar && (
                  <MenuItem
                    onClick={() => {
                      enviarADofaAhora(accionMenuAnchor.signo, accionMenuAnchor.key, accionMenuAnchor.id);
                    }}
                  >
                    <SendIcon fontSize="small" sx={{ mr: 1 }} />
                    Enviar a {labelAutomatico}
                  </MenuItem>
                )}
                {estaEnDofa && (
                  <MenuItem disabled sx={{ opacity: 1 }}>
                    <Typography variant="caption" color="text.secondary">Ya está en DOFA</Typography>
                  </MenuItem>
                )}
                {marcadoParaEnviar && (
                  <MenuItem
                    onClick={() => {
                      updateItemDofa(accionMenuAnchor.signo, accionMenuAnchor.key, accionMenuAnchor.id, false, undefined);
                      setAccionMenuAnchor(null);
                    }}
                  >
                    Quitar de DOFA
                  </MenuItem>
                )}
                <Divider />
                <MenuItem
                  onClick={() => {
                    removeItem(accionMenuAnchor.signo, accionMenuAnchor.key, accionMenuAnchor.id);
                    setAccionMenuAnchor(null);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  Eliminar
                </MenuItem>
              </>
            );
          })()}
        </Menu>
        )}

      </AppPageLayout>
    </>
  );
}
