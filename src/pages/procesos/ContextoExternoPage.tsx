/**
 * Contexto Externo Page
 * Misma estructura que Contexto Interno: pestañas Positivo/Negativo, características por categoría (ítems añadibles).
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
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, Edit as EditIcon, ThumbUp as PositivoIcon, ThumbDown as NegativoIcon, Add as AddIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';

type CategoryKey = 'economico' | 'culturalSocial' | 'legalRegulatorio' | 'tecnologico' | 'ambiental' | 'gruposInteresExternos' | 'politico' | 'megatendencias' | 'otrosFactores';

interface CaracteristicaItem {
  id: string;
  descripcion: string;
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
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [itemsPositivo, setItemsPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [itemsNegativo, setItemsNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialPositivo, setInitialPositivo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [initialNegativo, setInitialNegativo] = useState<Record<CategoryKey, CaracteristicaItem[]>>(emptyItems);
  const [tabValue, setTabValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [accionMenuAnchor, setAccionMenuAnchor] = useState<{ el: HTMLElement; signo: 'POSITIVO' | 'NEGATIVO'; key: CategoryKey; id: string } | null>(null);

  const arraysEqual = (a: CaracteristicaItem[], b: CaracteristicaItem[]) =>
    a.length === b.length && a.every((x, i) => x.id === b[i].id && x.descripcion === b[i].descripcion);
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
    const items = (procesoData as any).contextoItems as Array<{ id?: number; tipo: string; signo: string; descripcion: string }> | undefined;
    if (Array.isArray(items)) {
      items.forEach((it) => {
        const cat = CATEGORIAS.find((c) => c.tipo === it.tipo);
        if (!cat) return;
        const entry = { id: String(it.id ?? `${Date.now()}-${Math.random()}`), descripcion: it.descripcion ?? '' };
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
        const entry = { id: `legacy-${c.tipo}`, descripcion: c.descripcion.trim() };
        if (isNeg) { if (neg[cat.key].length === 0) neg[cat.key].push(entry); }
        else { if (pos[cat.key].length === 0) pos[cat.key].push(entry); }
      });
    }
    setItemsPositivo(pos);
    setItemsNegativo(neg);
    setInitialPositivo(pos);
    setInitialNegativo(neg);
  }, [procesoData]);

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

  const removeItem = (signo: 'POSITIVO' | 'NEGATIVO', key: CategoryKey, id: string) => {
    const setter = signo === 'POSITIVO' ? setItemsPositivo : setItemsNegativo;
    setter((prev) => ({ ...prev, [key]: prev[key].filter((it) => it.id !== id) }));
  };

  const handleSave = async () => {
    if (!procesoSeleccionado) return;
    const itemsExterno: Array<{ tipo: string; signo: string; descripcion: string }> = [];
    CATEGORIAS.forEach(({ key, tipo }) => {
      itemsPositivo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsExterno.push({ tipo, signo: 'POSITIVO', descripcion: it.descripcion.trim() });
      });
      itemsNegativo[key].forEach((it) => {
        if (it.descripcion.trim()) itemsExterno.push({ tipo, signo: 'NEGATIVO', descripcion: it.descripcion.trim() });
      });
    });
    const items = (procesoData as any).contextoItems as Array<{ tipo: string; signo: string; descripcion: string }> | undefined;
    const itemsInterno = Array.isArray(items) ? items.filter((it: any) => String(it.tipo).startsWith('INTERNO_')) : [];
    const contextoItems = [...itemsInterno, ...itemsExterno];
    const existingInternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('INTERNO_')) || [];

    try {
      setIsSaving(true);
      await updateProceso({
        id: procesoSeleccionado.id,
        contextos: existingInternos,
        contextoItems,
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
    <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
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
        {items.map((it) => (
          <Box key={it.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              size="small"
              value={it.descripcion}
              onChange={(e) => updateItem(signo, key, it.id, e.target.value)}
              disabled={isReadOnly}
              multiline
              minRows={1}
              maxRows={1}
              placeholder="Descripción de la característica"
              sx={{
                maxWidth: 900,
                flex: '1 1 520px',
                '& textarea': {
                  minHeight: 40,
                  maxHeight: 40,
                  overflowY: 'auto !important',
                },
              }}
            />
            {!isReadOnly && (
              <Tooltip title="Acciones">
                <IconButton
                  size="small"
                  onClick={(e) => setAccionMenuAnchor({ el: e.currentTarget, signo, key, id: it.id })}
                  aria-label="Acciones"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout title="Análisis de Contexto Externo" description="Factores externos del proceso" topContent={<FiltroProcesoSupervisor />}>
        <Box sx={{ p: 3 }}><Alert severity="info">Seleccione un proceso.</Alert></Box>
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
          {accionMenuAnchor && (
            <MenuItem
              onClick={() => {
                removeItem(accionMenuAnchor.signo, accionMenuAnchor.key, accionMenuAnchor.id);
                setAccionMenuAnchor(null);
              }}
              sx={{ color: 'error.main' }}
            >
              Eliminar
            </MenuItem>
          )}
        </Menu>
      </AppPageLayout>
    </>
  );
}
