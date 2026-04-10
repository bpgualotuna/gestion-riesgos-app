import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  useGetCamposHabilitacionUiQuery,
  useUpdateCamposHabilitacionUiMutation,
} from '../../api/services/riesgosApi';
import { UI_CAMPOS_HABILITACION_META } from '../../constants/uiCamposHabilitacion';
import { useNotification } from '../../hooks/useNotification';

function snapshotFromServer(data: Record<string, boolean> | undefined) {
  const next: Record<string, boolean> = {};
  for (const m of UI_CAMPOS_HABILITACION_META) {
    next[m.key] = data ? data[m.key] !== false : true;
  }
  return next;
}

export default function HabilitacionCamposPage() {
  const { showSuccess, showError } = useNotification();
  const { data, isLoading, isError, isFetching, refetch } =
    useGetCamposHabilitacionUiQuery();
  const [updateCampos, { isLoading: saving }] =
    useUpdateCamposHabilitacionUiMutation();
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data) setFlags(snapshotFromServer(data));
  }, [data]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    const baseline = snapshotFromServer(data);
    return UI_CAMPOS_HABILITACION_META.some(
      (m) => flags[m.key] !== baseline[m.key],
    );
  }, [data, flags]);

  const handleToggle = (key: string, checked: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: checked }));
  };

  const handleGuardar = async () => {
    try {
      await updateCampos(flags).unwrap();
      showSuccess('Configuración guardada. Los formularios aplicarán los cambios al instante.');
      await refetch();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ||
        (e as Error)?.message ||
        'No se pudo guardar.';
      showError(msg);
    }
  };

  const handleRestaurar = () => {
    if (data) setFlags(snapshotFromServer(data));
  };

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        No se pudo cargar la configuración. Verifique la sesión y la API.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Habilitación de campos en formularios
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        Cada interruptor en <strong>activado</strong> permite que los usuarios editen ese dato en la
        aplicación. Si lo desactiva, el campo queda bloqueado en pantalla y el servidor rechazará
        intentos de guardar cambios (código <code>FIELD_LOCKED</code>). Puede alternar las veces que
        necesite.
      </Typography>

      {isFetching && !isLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Actualizando valores desde el servidor…
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {UI_CAMPOS_HABILITACION_META.map((meta, i) => (
          <Box key={meta.key}>
            {i > 0 && <Divider sx={{ my: 2 }} />}
            <FormControlLabel
              control={
                <Switch
                  checked={flags[meta.key] !== false}
                  onChange={(_, c) => handleToggle(meta.key, c)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {meta.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {meta.descripcion}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    {flags[meta.key] !== false
                      ? 'Edición permitida en formularios y API.'
                      : 'Solo lectura: bloqueado en UI y validado en el servidor.'}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', ml: 0, mr: 0, width: '100%' }}
            />
          </Box>
        ))}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={saving || isLoading || !isDirty}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleRestaurar}
          disabled={saving || !isDirty}
        >
          Descartar cambios
        </Button>
      </Box>
    </Box>
  );
}
