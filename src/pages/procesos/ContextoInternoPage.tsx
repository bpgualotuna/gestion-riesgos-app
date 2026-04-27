/**
 * Contexto Interno Page
 * Análisis de factores internos: pestañas Positivo/Negativo, cada categoría con ítems (características) añadibles.
 */

import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
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
import { Visibility as VisibilityIcon, Edit as EditIcon, ThumbUp as PositivoIcon, ThumbDown as NegativoIcon, Add as AddIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { Alert } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useUpdateProcesoMutation, riesgosApi } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import EnviarDofaContextoButton from '../../components/contexto/EnviarDofaContextoButton';
import GuardarContextoButton from '../../components/contexto/GuardarContextoButton';
import type { ScreenContext } from '../../types/ia.types';
import {
  dofaTipoDesdeContextoInterno,
  enviarADofaDesdeApi,
  encuentraEnDofaCuadrante,
  mergeDofaItemsWithContext,
  normDesc,
  normalizeDofaTipoToCanonical,
} from '../../utils/contextoDofaSync';

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
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { setScreenContext } = useCoraIAContext(); // NUEVO: Hook de CORA IA
  const { confirmDelete } = useConfirm();

  const { data: procesoData, refetch: refetchProceso } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [itemsPositivo, setItemsPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [itemsNegativo, setItemsNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialPositivo, setInitialPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialNegativo, setInitialNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState<'idle' | 'context' | 'dofa'>('idle');
  const isBusy = saving !== 'idle';
  const [accionMenuAnchor, setAccionMenuAnchor] = useState<{ el: HTMLElement; signo: 'POSITIVO' | 'NEGATIVO'; key: CategoryKey; id: string } | null>(null);
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
          /** Por defecto sí va al DOFA al guardar; `false` en BD legado se trata como "incluir" (ver enviarADofaDesdeApi). */
          enviarADofa: enviarADofaDesdeApi(it.enviarADofa),
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
        const entry: CaracteristicaItem = { id: `legacy-${c.tipo}`, descripcion: c.descripcion.trim(), enviarADofa: undefined };
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
          enDofa: it.descripcion.trim() ? !!getDofaStatus(it.descripcion, signo) : false
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
      [key]: [...prev[key], { id: `temp-${Date.now()}-${Math.random()}`, descripcion: '' }],
    }));
  };

  const updateItem = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string, descripcion: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: prev[key].map((it) => (it.id === id ? { ...it, descripcion } : it)),
    }));
  };

  const dofaItems = (procesoData as any)?.dofaItems as Array<{ tipo: string; descripcion: string }> | undefined;
  /** ✓ si el texto está en el cuadrante correcto (F/D). No depende de enviarADofa (evita ✗ con datos viejos). */
  const getDofaStatus = (descripcion: string, signo: 'POSITIVO' | 'NEGATIVO') =>
    encuentraEnDofaCuadrante(dofaItems, descripcion, signo, 'INTERNO');

  const hasPendingDofaSync = useMemo(() => {
    for (const { key } of CATEGORIAS) {
      for (const it of itemsPositivo[key]) {
        if (it.descripcion.trim() && !encuentraEnDofaCuadrante(dofaItems, it.descripcion, 'POSITIVO', 'INTERNO')) return true;
      }
      for (const it of itemsNegativo[key]) {
        if (it.descripcion.trim() && !encuentraEnDofaCuadrante(dofaItems, it.descripcion, 'NEGATIVO', 'INTERNO')) return true;
      }
    }
    return false;
  }, [itemsPositivo, itemsNegativo, dofaItems]);

  const canEnviarDofa = !isReadOnly && (hasAnyChanges || hasPendingDofaSync);

  const buildContextoPayloadFromState = (
    pos: Record<CategoryKey, CaracteristicaItem[]>,
    neg: Record<CategoryKey, CaracteristicaItem[]>
  ) => {
    const itemsInterno: Array<{ tipo: string; signo: string; descripcion: string; enviarADofa?: boolean; dofaDimension?: string }> = [];
    CATEGORIAS.forEach(({ key, tipo }) => {
      pos[key].forEach((it) => {
        if (!it.descripcion.trim()) return;
        const excluir = it.enviarADofa === false;
        const dim = dofaTipoDesdeContextoInterno('POSITIVO');
        itemsInterno.push({
          tipo,
          signo: 'POSITIVO',
          descripcion: it.descripcion.trim(),
          enviarADofa: !excluir,
          dofaDimension: !excluir ? dim : undefined,
        });
      });
      neg[key].forEach((it) => {
        if (!it.descripcion.trim()) return;
        const excluir = it.enviarADofa === false;
        const dim = dofaTipoDesdeContextoInterno('NEGATIVO');
        itemsInterno.push({
          tipo,
          signo: 'NEGATIVO',
          descripcion: it.descripcion.trim(),
          enviarADofa: !excluir,
          dofaDimension: !excluir ? dim : undefined,
        });
      });
    });
    const items = (procesoData as any).contextoItems as Array<{ tipo: string; signo: string; descripcion: string }> | undefined;
    const itemsExterno = Array.isArray(items) ? items.filter((it: any) => String(it.tipo).startsWith('EXTERNO_')) : [];
    const contextoItems = [...itemsInterno, ...itemsExterno];
    const existingExternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('EXTERNO_')) || [];
    return { contextoItems, existingExternos };
  };

  const buildContextoPayload = () => buildContextoPayloadFromState(itemsPositivo, itemsNegativo);

  const handleGuardarContexto = async () => {
    if (!procesoSeleccionado) return;
    const { contextoItems, existingExternos } = buildContextoPayload();
    const patchContextoCache = () => {
      const pid = procesoSeleccionado?.id;
      if (pid == null || pid === '') return;
      dispatch(
        riesgosApi.util.updateQueryData('getProcesoById', String(pid), (draft) => {
          const d = draft as { contextoItems?: typeof contextoItems };
          d.contextoItems = contextoItems;
        })
      );
    };
    try {
      setSaving('context');
      await updateProceso({
        id: String(procesoSeleccionado.id),
        contextos: existingExternos,
        contextoItems,
      } as any).unwrap();
      patchContextoCache();
      setInitialPositivo(itemsPositivo);
      setInitialNegativo(itemsNegativo);
      markAsSaved();
      await refetchProceso();
      patchContextoCache();
      showSuccess('Guardado.');
    } catch (e) {
      showError('Error al guardar.');
      throw e;
    } finally {
      setSaving('idle');
    }
  };

  const handleEnviarDofa = async () => {
    if (!procesoSeleccionado) return;
    const { contextoItems, existingExternos } = buildContextoPayload();

    const currentDofa = (Array.isArray(dofaItems) ? [...dofaItems] : []) as Array<{ tipo: string; descripcion: string }>;
    
    // Crear un mapa de textos antiguos a nuevos para actualizar DOFA
    const textosAntiguosANuevos = new Map<string, { nuevoTexto: string; dimension: string }>();
    
    // Comparar con los valores iniciales para detectar cambios de texto
    CATEGORIAS.forEach(({ key }) => {
      itemsPositivo[key].forEach((itemActual) => {
        const itemInicial = initialPositivo[key].find((i) => i.id === itemActual.id);
        if (itemInicial && itemInicial.descripcion.trim() !== itemActual.descripcion.trim()) {
          const esperado = dofaTipoDesdeContextoInterno('POSITIVO');
          const enDofa = dofaItems?.find(
            (d: { tipo: string; descripcion: string }) =>
              normalizeDofaTipoToCanonical(d.tipo) === esperado &&
              normDesc(d.descripcion) === normDesc(itemInicial.descripcion)
          );
          if (enDofa) {
            const tc = normalizeDofaTipoToCanonical(enDofa.tipo) ?? esperado;
            textosAntiguosANuevos.set(`${tc}:${normDesc(itemInicial.descripcion)}`, {
              nuevoTexto: itemActual.descripcion.trim(),
              dimension: enDofa.tipo,
            });
          }
        }
      });

      itemsNegativo[key].forEach((itemActual) => {
        const itemInicial = initialNegativo[key].find((i) => i.id === itemActual.id);
        if (itemInicial && itemInicial.descripcion.trim() !== itemActual.descripcion.trim()) {
          const esperado = dofaTipoDesdeContextoInterno('NEGATIVO');
          const enDofa = dofaItems?.find(
            (d: { tipo: string; descripcion: string }) =>
              normalizeDofaTipoToCanonical(d.tipo) === esperado &&
              normDesc(d.descripcion) === normDesc(itemInicial.descripcion)
          );
          if (enDofa) {
            const tc = normalizeDofaTipoToCanonical(enDofa.tipo) ?? esperado;
            textosAntiguosANuevos.set(`${tc}:${normDesc(itemInicial.descripcion)}`, {
              nuevoTexto: itemActual.descripcion.trim(),
              dimension: enDofa.tipo,
            });
          }
        }
      });
    });

    const dofaActualizado = currentDofa.map((d) => {
      const tc = normalizeDofaTipoToCanonical(d.tipo);
      if (!tc) return d;
      const key = `${tc}:${normDesc(d.descripcion)}`;
      const cambio = textosAntiguosANuevos.get(key);
      if (cambio) return { tipo: tc, descripcion: cambio.nuevoTexto };
      return { ...d, tipo: tc };
    });
    
    const dofaMerged = mergeDofaItemsWithContext(dofaActualizado, contextoItems);
    const dofaPayload = dofaMerged.map((d) => ({ tipo: d.tipo, descripcion: d.descripcion }));

    const patchProcesoCacheConDofa = () => {
      const pid = procesoSeleccionado?.id;
      if (pid == null || pid === '') return;
      dispatch(
        riesgosApi.util.updateQueryData('getProcesoById', String(pid), (draft) => {
          const d = draft as { dofaItems?: typeof dofaPayload; contextoItems?: typeof contextoItems };
          d.dofaItems = dofaPayload;
          d.contextoItems = contextoItems;
        })
      );
    };

    try {
      setSaving('dofa');
      await updateProceso({
        id: String(procesoSeleccionado.id),
        contextos: existingExternos,
        contextoItems,
        dofaItems: dofaPayload,
      } as any).unwrap();
      patchProcesoCacheConDofa();
      setInitialPositivo(itemsPositivo);
      setInitialNegativo(itemsNegativo);
      markAsSaved();
      await refetchProceso();
      patchProcesoCacheConDofa();
      showSuccess('Matriz DOFA actualizada con las características pendientes.');
    } catch {
      showError('Error al enviar a la matriz DOFA.');
    } finally {
      setSaving('idle');
    }
  };

  const handleGuardarContextoFromDialog = async () => {
    try {
      await handleGuardarContexto();
      forceNavigate();
    } catch {
      /* error ya mostrado */
    }
  };

  const handleEliminarCaracteristica = async (
    signo: 'POSITIVO' | 'NEGATIVO',
    key: CategoryKey,
    id: string,
    row: CaracteristicaItem
  ) => {
    if (!procesoSeleccionado) return;
    const ok = await confirmDelete(
      'esta fila del análisis. Si está en la matriz DOFA, también se eliminará de allí al confirmar'
    );
    if (!ok) return;

    const nextPos =
      signo === 'POSITIVO'
        ? { ...itemsPositivo, [key]: itemsPositivo[key].filter((x) => x.id !== id) }
        : itemsPositivo;
    const nextNeg =
      signo === 'NEGATIVO'
        ? { ...itemsNegativo, [key]: itemsNegativo[key].filter((x) => x.id !== id) }
        : itemsNegativo;

    const { contextoItems, existingExternos } = buildContextoPayloadFromState(nextPos, nextNeg);
    const currentDofa = (Array.isArray(dofaItems) ? [...dofaItems] : []) as Array<{ tipo: string; descripcion: string }>;
    const expected = dofaTipoDesdeContextoInterno(signo);
    const textNorm = normDesc(row.descripcion);
    const dofaFiltered =
      row.descripcion.trim().length > 0
        ? currentDofa.filter((d) => {
            const tc = normalizeDofaTipoToCanonical(d.tipo);
            return !(tc === expected && normDesc(d.descripcion) === textNorm);
          })
        : currentDofa;

    const dofaMerged = mergeDofaItemsWithContext(dofaFiltered, contextoItems);
    const dofaPayload = dofaMerged.map((d) => ({ tipo: d.tipo, descripcion: d.descripcion }));

    const patchFull = () => {
      const pid = procesoSeleccionado?.id;
      if (pid == null || pid === '') return;
      dispatch(
        riesgosApi.util.updateQueryData('getProcesoById', String(pid), (draft) => {
          const d = draft as { dofaItems?: typeof dofaPayload; contextoItems?: typeof contextoItems };
          d.dofaItems = dofaPayload;
          d.contextoItems = contextoItems;
        })
      );
    };

    try {
      setSaving('context');
      await updateProceso({
        id: String(procesoSeleccionado.id),
        contextos: existingExternos,
        contextoItems,
        dofaItems: dofaPayload,
      } as any).unwrap();
      patchFull();
      setItemsPositivo(nextPos);
      setItemsNegativo(nextNeg);
      setInitialPositivo(nextPos);
      setInitialNegativo(nextNeg);
      markAsSaved();
      await refetchProceso();
      patchFull();
      showSuccess('Eliminado.');
    } catch {
      showError('Error al eliminar.');
    } finally {
      setSaving('idle');
    }
  };

  const handleDiscardChanges = () => {
    setItemsPositivo(initialPositivo);
    setItemsNegativo(initialNegativo);
    forceNavigate();
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
          const excluidoDofa = it.enviarADofa === false;
          const enDofa = it.descripcion.trim() ? getDofaStatus(it.descripcion, signo) : null;
          const mostrarVisto = !!enDofa;
          return (
            <Box key={it.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                {/* Icono estado DOFA: ✓ si está/marcado, ✗ si no */}
                <Box sx={{ pt: 1, flexShrink: 0, width: 28, display: 'flex', justifyContent: 'center' }}>
                  {it.descripcion.trim() ? (
                    mostrarVisto ? (
                      <Tooltip title={`En DOFA (${DOFA_DIMENSIONES.find((d) => d.value === enDofa!.dimension)?.label ?? enDofa!.dimension})`}>
                        <CheckCircleIcon fontSize="small" color="success" />
                      </Tooltip>
                    ) : (
                      <Tooltip title={excluidoDofa ? 'Excluido del DOFA (dato antiguo)' : 'Aún no figura en el cuadrante DOFA (guarda contexto para sincronizar)'}>
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
        <Box sx={{ p: 3 }}><Alert severity="info" variant="outlined">No hay proceso seleccionado.</Alert></Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleGuardarContextoFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isBusy}
        message="Tiene cambios sin guardar en el análisis de contexto interno."
        description="¿Guardar antes de salir?"
      />
      <AppPageLayout
        title="Análisis de Contexto Interno"
        description="Factores internos: características por categoría (positivo y negativo)"
        topContent={<FiltroProcesoSupervisor />}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {!isReadOnly && (
              <>
                <GuardarContextoButton
                  onClick={handleGuardarContexto}
                  disabled={!hasAnyChanges || isBusy}
                  isSaving={saving === 'context'}
                />
                <EnviarDofaContextoButton
                  onClick={handleEnviarDofa}
                  disabled={!canEnviarDofa || isBusy}
                  isSaving={saving === 'dofa'}
                />
              </>
            )}
          </Box>
        }
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab
              label={
                <Tooltip
                  title='Fortalezas (F). Guarde con "Guardar"; envíe a la matriz con "Enviar a DOFA".'
                  placement="bottom"
                  arrow
                  enterDelay={400}
                >
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <PositivoIcon fontSize="small" />
                    Positivo
                  </Box>
                </Tooltip>
              }
            />
            <Tab
              label={
                <Tooltip
                  title='Debilidades (D). Guarde con "Guardar"; envíe a la matriz con "Enviar a DOFA".'
                  placement="bottom"
                  arrow
                  enterDelay={400}
                >
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <NegativoIcon fontSize="small" />
                    Negativo
                  </Box>
                </Tooltip>
              }
            />
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
            return (
              <>
                <MenuItem disabled sx={{ opacity: 1, whiteSpace: 'normal', maxWidth: 280 }}>
                  <Typography variant="caption" color="text.secondary">
                    "Guardar" y "Enviar a DOFA" sincronizan con la matriz. Eliminar aquí quita la fila del contexto y del DOFA (un solo paso). Para quitar solo del DOFA sin borrar el contexto, usa la pantalla Matriz DOFA.
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={async () => {
                    const signo = accionMenuAnchor.signo;
                    const key = accionMenuAnchor.key;
                    const id = accionMenuAnchor.id;
                    setAccionMenuAnchor(null);
                    const lista = signo === 'POSITIVO' ? itemsPositivo[key] : itemsNegativo[key];
                    const row = lista.find((i) => i.id === id);
                    if (!row) return;
                    await handleEliminarCaracteristica(signo, key, id, row);
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
