/**
 * Contexto Externo Page
 * Misma estructura que Contexto Interno: pestañas Positivo/Negativo, características por categoría (ítems añadibles).
 */

import { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, Edit as EditIcon, ThumbUp as PositivoIcon, ThumbDown as NegativoIcon, Add as AddIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, MoreVert as MoreVertIcon, Send as SendIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';

type CategoryKey = 'economico' | 'culturalSocial' | 'legalRegulatorio' | 'tecnologico' | 'ambiental' | 'gruposInteresExternos' | 'politico' | 'megatendencias' | 'otrosFactores';

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

const CATEGORIAS: { key: CategoryKey; label: string; tipo: string }[] = [
  { key: 'economico', label: 'Económico', tipo: 'EXTERNO_ECONOMICO' },
  { key: 'culturalSocial', label: 'Cultural y Social', tipo: 'EXTERNO_CULTURALSOCIAL' },
  { key: 'legalRegulatorio', label: 'Legal/Regulatorio', tipo: 'EXTERNO_LEGALREGULATORIO' },
  { key: 'tecnologico', label: 'Tecnológico', tipo: 'EXTERNO_TECNOLOGICO' },
  { key: 'ambiental', label: 'Ambiental', tipo: 'EXTERNO_AMBIENTAL' },
  { key: 'gruposInteresExternos', label: 'Grupos de Interés Externos', tipo: 'EXTERNO_GRUPOSINTERESEXTERNOS' },
  { key: 'politico', label: 'Político', tipo: 'EXTERNO_POLITICO' },
  { key: 'megatendencias', label: 'Megatendencias', tipo: 'EXTERNO_MEGATENDENCIAS' },
  { key: 'otrosFactores', label: 'Otros Factores Externos', tipo: 'EXTERNO_OTROSFACTORES' },
];

const emptyItems = (): Record<CategoryKey, CaracteristicaItem[]> =>
  CATEGORIAS.reduce((acc, { key }) => ({ ...acc, [key]: [] }), {} as Record<CategoryKey, CaracteristicaItem[]>);

export default function ContextoExternoPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

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
    message: 'Tiene cambios sin guardar en el análisis de contexto externo.',
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
    const contextos = procesoData.contextos as Array<{ tipo: string; descripcion: string }> | undefined;
    if (Array.isArray(contextos)) {
      contextos.forEach((c) => {
        const isNeg = c.tipo.endsWith('_NEG');
        const tipoBase = isNeg ? c.tipo.replace(/_NEG$/, '') : c.tipo;
        const cat = CATEGORIAS.find((c2) => c2.tipo === tipoBase);
        if (!cat || !c.descripcion?.trim()) return;
        const entry: CaracteristicaItem = { id: `legacy-${c.tipo}`, descripcion: c.descripcion.trim(), enviarADofa: false };
        if (isNeg) { if (neg[cat.key].length === 0) neg[cat.key].push(entry); }
        else { if (pos[cat.key].length === 0) pos[cat.key].push(entry); }
      });
    }
    setItemsPositivo(pos);
    setItemsNegativo(neg);
    setInitialPositivo(pos);
    setInitialNegativo(neg);
  }, [procesoData]);

  const addItem = useCallback((signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: `temp-${Date.now()}-${Math.random()}`, descripcion: '', enviarADofa: false }],
    }));
  }, []);

  const updateItem = useCallback((signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string, descripcion: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: prev[key].map((it) => (it.id === id ? { ...it, descripcion } : it)),
    }));
  }, []);

  const removeItem = useCallback((signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({ ...prev, [key]: prev[key].filter((it) => it.id !== id) }));
  }, []);

  const updateItemDofa = useCallback((signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string, enviarADofa?: boolean, dofaDimension?: DofaDimension) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({
      ...prev,
      [key]: prev[key].map((it) =>
        it.id === id ? { ...it, enviarADofa: enviarADofa ?? it.enviarADofa, dofaDimension: dofaDimension !== undefined ? dofaDimension : it.dofaDimension } : it
      ),
    }));
  }, []);

  const dofaItems = (procesoData as any)?.dofaItems as Array<{ tipo: string; descripcion: string }> | undefined;
  /** Busca en todo el DOFA (D, O, F, A); si el texto existe en alguna dimensión devuelve cuál, si no null. Solo puede estar en una. */
  const getDofaStatus = (descripcion: string): { dimension: string } | null => {
    if (!descripcion?.trim() || !Array.isArray(dofaItems)) return null;
    const text = descripcion.trim().toLowerCase();
    const found = dofaItems.find((d: any) => (d.descripcion || '').trim().toLowerCase() === text);
    return found ? { dimension: found.tipo } : null;
  };

  const enviarADofaAhora = async (dimension: DofaDimension, label: string, signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string) => {
    if (!procesoSeleccionado) return;
    const source = signo === 'POSITIVO' ? itemsPositivo : itemsNegativo;
    const it = source[key].find((x) => x.id === id);
    if (!it?.descripcion?.trim()) return;

    const currentDofa = (Array.isArray(dofaItems) ? [...dofaItems] : []) as Array<{ tipo: string; descripcion: string }>;
    const descInDofa = new Set(currentDofa.map((d) => `${d.tipo}:${(d.descripcion || '').trim().toLowerCase()}`));
    const k = `${dimension}:${it.descripcion.trim().toLowerCase()}`;
    if (descInDofa.has(k)) {
      showError('Ya existe en DOFA.');
      return;
    }
    const newDofa = [...currentDofa, { tipo: dimension, descripcion: it.descripcion.trim() }];

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

  const handleSave = async () => {
    if (!procesoSeleccionado) return;
    const itemsExterno: Array<{ tipo: string; signo: string; descripcion: string; enviarADofa?: boolean; dofaDimension?: string }> = [];
    CATEGORIAS.forEach(({ key, tipo }) => {
      itemsPositivo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsExterno.push({
          tipo, signo: 'POSITIVO', descripcion: it.descripcion.trim(),
          enviarADofa: it.enviarADofa === true, dofaDimension: it.dofaDimension || undefined,
        });
      });
      itemsNegativo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsExterno.push({
          tipo, signo: 'NEGATIVO', descripcion: it.descripcion.trim(),
          enviarADofa: it.enviarADofa === true, dofaDimension: it.dofaDimension || undefined,
        });
      });
    });
    const items = (procesoData as any).contextoItems as Array<{ tipo: string; signo: string; descripcion: string }> | undefined;
    const itemsInterno = Array.isArray(items) ? items.filter((it: any) => String(it.tipo).startsWith('INTERNO_')) : [];
    const contextoItems = [...itemsInterno, ...itemsExterno];
    const existingInternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('INTERNO_')) || [];

    const currentDofa = (Array.isArray(dofaItems) ? [...dofaItems] : []) as Array<{ tipo: string; descripcion: string }>;
    const descInDofa = new Set(currentDofa.map((d) => `${d.tipo}:${(d.descripcion || '').trim().toLowerCase()}`));
    itemsExterno.forEach((it) => {
      if (it.enviarADofa && it.dofaDimension && it.descripcion) {
        const k = `${it.dofaDimension}:${it.descripcion.trim().toLowerCase()}`;
        if (!descInDofa.has(k)) {
          currentDofa.push({ tipo: it.dofaDimension as any, descripcion: it.descripcion });
          descInDofa.add(k);
        }
      }
    });
    const dofaPayload = currentDofa.map((d) => ({ tipo: d.tipo, descripcion: d.descripcion }));

    try {
      setIsSaving(true);
      await updateProceso({
        id: String(procesoSeleccionado.id),
        contextos: existingInternos,
        contextoItems,
        dofaItems: dofaPayload,
      } as any).unwrap();
      setInitialPositivo(itemsPositivo);
      setInitialNegativo(itemsNegativo);
      markAsSaved();
      showSuccess('Contexto externo guardado.');
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

  const renderCategoria = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, label: string, items: CaracteristicaItem[]) => (
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
        <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
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
      <AppPageLayout title="Análisis de Contexto Externo" description="Factores externos del proceso" topContent={<FiltroProcesoSupervisor />}>
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout title="Análisis de Contexto Externo" description="Factores externos del proceso" topContent={<FiltroProcesoSupervisor />}>
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
        message="Tiene cambios sin guardar en el análisis de contexto externo."
        description="¿Guardar antes de salir?"
      />
      <AppPageLayout
        title="Análisis de Contexto Externo"
        description="Factores externos: características por categoría (positivo y negativo)"
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
              {CATEGORIAS.map(({ key, label }) => renderCategoria('POSITIVO', key, label, itemsPositivo[key]))}
            </Box>
          )}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 960 }}>
              {CATEGORIAS.map(({ key, label }) => renderCategoria('NEGATIVO', key, label, itemsNegativo[key]))}
            </Box>
          )}
        </Box>

        <Menu
          anchorEl={accionMenuAnchor?.el ?? null}
          open={!!accionMenuAnchor}
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
            return (
              <>
                {puedeEnviar && (
                  <>
                    <MenuItem disabled sx={{ opacity: 1 }}>
                      <Typography variant="caption" color="text.secondary">Enviar a DOFA (D, O, F, A):</Typography>
                    </MenuItem>
                    {DOFA_DIMENSIONES.map((d) => (
                      <MenuItem
                        key={d.value}
                        disableRipple
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
                      >
                        <Typography variant="body2">{d.letra} — {d.label}</Typography>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<SendIcon />}
                          disabled={enviandoDofa}
                          onClick={(e) => {
                            e.stopPropagation();
                            enviarADofaAhora(d.value, d.label, accionMenuAnchor.signo, accionMenuAnchor.key, accionMenuAnchor.id);
                          }}
                        >
                          Enviar
                        </Button>
                      </MenuItem>
                    ))}
                  </>
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
      </AppPageLayout>
    </>
  );
}
